/**
 * Module to deal with available AIMS Public API endpoints
 */

import {
    AlApiClient,
    AlDefaultClient,
} from "../client";
import { AlResponseValidationError } from "../common/errors";
import {
    AlLocation,
    AlLocatorService,
} from "../common/locator";
import {
    AIMSAccessKey,
    AIMSAccount,
    AIMSAuthenticationTokenInfo,
    AIMSOrganization,
    AIMSRole,
    AIMSSessionDescriptor,
    AIMSTopology,
    AIMSUser,
} from './types';

export class AIMSClientInstance {

  private client:AlApiClient;
  private serviceName = 'aims';

  constructor( client:AlApiClient = null ) {
    this.client = client || AlDefaultClient;
  }

  /**
   * Create a user
   * POST
   * /aims/v1/:account_id/users?one_time_password=:one_time_password
   * "https://api.cloudinsight.alertlogic.com/aims/v1/12345678/users"
   * -d '{ "name": "Bob Dobalina", "email": "admin@company.com", "mobile_phone": "123-555-0123" }'
   */
  async createUser(accountId: string, name: string, email: string, mobilePhone: string) {
    const user = await this.client.post({
      service_name: this.serviceName,
      account_id: accountId,
      path: '/users',
      data: { name, email, mobile_phone: mobilePhone }
    });
    return user as AIMSUser;
  }

  /**
   * Delete a user
   * DELETE
   * /aims/v1/:account_id/users/:user_id
   * "https://api.cloudinsight.alertlogic.com/aims/v1/12345678/users/715A4EC0-9833-4D6E-9C03-A537E3F98D23"
   */
  async deleteUser(accountId: string, userId: string) {
    const userDelete = await this.client.delete({
      service_name: this.serviceName,
      account_id: accountId,
      path: `/users/${userId}`,
    });
    return userDelete;
  }

  /**
   * Get user details
   * GET
   * /aims/v1/:account_id/users/:user_id
   * "https://api.cloudinsight.alertlogic.com/aims/v1/12345678/users/715A4EC0-9833-4D6E-9C03-A537E3F98D23"
   */
  async getUserDetailsById(accountId: string, userId: string) {
    const userDetails = await this.client.get({
      service_name: this.serviceName,
      account_id: accountId,
      path: `/users/${userId}`,
      retry_count: 5,
      ttl: 2 * 60 * 1000
    });
    return userDetails as AIMSUser;
  }

  /**
   * Get user permissions
   * GET
   * /aims/v1/:account_id/users/:user_id/permissions
   * "https://api.cloudinsight.alertlogic.com/aims/v1/12345678/users/715A4EC0-9833-4D6E-9C03-A537E3F98D23/permissions"
   */
  async getUserPermissions(accountId: string, userId: string) {
    const userPermissions = await this.client.get({
      service_name: this.serviceName,
      account_id: accountId,
      path: `/users/${userId}/permissions`,
      ttl: 2 * 60 * 1000
    });
    return userPermissions;
  }

  /**
   * Get Account Details
   * GET
   * /aims/v1/:account_id/account
   * "https://api.cloudinsight.alertlogic.com/aims/v1/12345678/account"
   */
  async getAccountDetails(accountId: string) {
    const accountDetails = await this.client.get({
      service_name: this.serviceName,
      account_id: accountId,
      path: '/account',
      retry_count: 5,
      ttl: 2 * 60 * 1000
    });
    return accountDetails as AIMSAccount;
  }

  /**
   * @deprecated use getAccountsByRelationship
   * List managed accounts
   * GET
   * /aims/v1/:account_id/accounts/:relationship
   * "https://api.cloudinsight.alertlogic.com/aims/v1/12345678/accounts/managed"
   */
  async getManagedAccounts(accountId: string, queryParams?):Promise<AIMSAccount[]> {
    return this.getAccountsByRelationship(accountId, 'managed', queryParams );
  }

  /**
   * @deprecated use getAccountIdsByRelationship
   * List managed account IDs
   * GET
   * /aims/v1/:account_id/account_ids/:relationship
   * "https://api.cloudinsight.alertlogic.com/aims/v1/12345678/account_ids/managed"
   */
  async getManagedAccountIds(accountId: string, queryParams?):Promise<string[]> {
    return this.getAccountIdsByRelationship(accountId, 'managed', queryParams );
  }

  /**
   * List account IDs, by relationship can be managing, managed and bills_to
   * GET
   * /aims/v1/:account_id/account_ids/:relationship
   * "https://api.cloudinsight.alertlogic.com/aims/v1/12345678/account_ids/managing"
   * "https://api.cloudinsight.alertlogic.com/aims/v1/12345678/account_ids/managed"
   * "https://api.cloudinsight.alertlogic.com/aims/v1/12345678/account_ids/bills_to"
   */
  async getAccountIdsByRelationship(accountId: string, relationship: string, queryParams?):Promise<string[]> {
    const accountIds = await this.client.get({
      service_name: this.serviceName,
      account_id: accountId,
      path: `/account_ids/${relationship}`,
      params: queryParams,
      retry_count: 5,
      ttl: 2 * 60 * 1000
    });
    return accountIds.account_ids as string[];
  }

  /**
   * List accounts, by relationship can be managing, managed and bills_to
   * GET
   * /aims/v1/:account_id/accounts/:relationship
   * "https://api.cloudinsight.alertlogic.com/aims/v1/12345678/accounts/managing"
   * "https://api.cloudinsight.alertlogic.com/aims/v1/12345678/accounts/managed"
   * "https://api.cloudinsight.alertlogic.com/aims/v1/12345678/accounts/bills_to"
   */
  async getAccountsByRelationship(accountId: string, relationship: string, queryParams?):Promise<AIMSAccount[]> {
    const managedAccounts = await this.client.get({
      service_name: this.serviceName,
      account_id: accountId,
      path: `/accounts/${relationship}`,
      params: queryParams,
      retry_count: 5,
      ttl: 2 * 60 * 1000
    });
    return managedAccounts.accounts as AIMSAccount[];
  }

  /**
   *  Retrieve a union of user records corresponding to a managed relationship hierarchy between two accounts.
   *  This is a placeholder for a better implementation based on a relationship topology endpoint from AIMS.0
   *  @deprecated use getAccountsIdsByRelationship in conjunction with getUsersFromAccounts
   */
  async getUsersFromManagedRelationship( leafAccountId:string, terminalAccountId?:string, failOnError:boolean = true ):Promise<AIMSUser[]> {
    let users = await this.getUsers( leafAccountId, { include_role_ids: false, include_user_credential: false } );
    try {
      let managing = await this.getAccountsByRelationship( leafAccountId, "managing" );
      if ( managing.length > 0 ) {
        managing.sort( ( a, b ) => parseInt( b.id, 10 ) - parseInt( a.id, 10 ) );               //  this is gross hackery.  Kevin did not implement this.  Tell no-one of what you've seen!
        let parentUsers = await this.getUsersFromManagedRelationship( managing[0].id, terminalAccountId );
        if ( Array.isArray( parentUsers ) ) {
          users = users.concat( parentUsers );
        }
      }
    } catch( e ) {
      if ( failOnError ) {
        throw e;
      }
    }
    return users;
  }

  /**
   * Update account MFA requirements
   * POST
   * /aims/v1/:account_id/account
   * -d '{"mfa_required": true}' "https://api.cloudinsight.alertlogic.com/aims/v1/12345678/account"
   */
  async requireMFA(accountId: string, mfaRequired: boolean):Promise<AIMSAccount> {
    const account = await this.client.post({
      service_name: this.serviceName,
      account_id: accountId,
      path: '/account',
      data: { mfa_required: mfaRequired }
    });
    return account as AIMSAccount;
  }

  /**
   * Authenticate a user's identity
   * POST
   * /aims/v1/authenticate
   * -u username:password "https://api.cloudinsight.alertlogic.com/aims/v1/authenticate"
   */
  async authenticate( user:string, pass:string, mfa?:string ): Promise<AIMSSessionDescriptor> {
    return this.client.authenticate( user, pass, mfa, true );
  }

  /**
   * Authenticate a user's identity with an mfa code and session token
   */
  async authenticateWithMFASessionToken(token: string, mfa: string): Promise<AIMSSessionDescriptor> {
    return this.client.authenticateWithMFASessionToken(token, mfa, true );
  }

  /**
   * Change a user's password
   * POST
   * /aims/v1/change_password
   * -d '{"email": "admin@company.com", "current_password": "hunter2", "new_password": "Fraudulent$Foes"}' "https://api.cloudinsight.alertlogic.com/aims/v1/change_password"
   */
  async changePassword(email: string, password: string, newPassword: string) {
    const changePass = await this.client.post({
      service_name: this.serviceName,
      path: '/change_password',
      data: { email, current_password: password, new_password: newPassword }
    });
    return changePass;
  }

  /**
   * Obtain Authentication Token Information (Account, User, Roles, etc.)
   *
   * @deprecated
   *
   * GET
   * /aims/v1/token_info
   * "https://api.cloudinsight.alertlogic.com/aims/v1/token_info"
   */
  async tokenInfo() {
    const tokenData = await this.client.get({
      service_name: this.serviceName,
      path: '/token_info',
    });
    return tokenData as AIMSAuthenticationTokenInfo;
  }

  /**
   * Obtain Authentication Token Information for a specific access token
   */
  public async getTokenInfo( accessToken:string ):Promise<AIMSAuthenticationTokenInfo> {
    return this.client.get( {
      service_stack: AlLocation.GlobalAPI,
      service_name: this.serviceName,
      version: 1,
      path: '/token_info',
      headers: {
        'X-AIMS-Auth-Token': accessToken
      },
      ttl: 10 * 60 * 1000,
      cacheKey: AlLocatorService.resolveURL( AlLocation.GlobalAPI, `/aims/v1/token_info/${accessToken}` )       //  custom cacheKey to avoid cache pollution
    } );
  }

  /**
   * Initiate the password reset process for a user
   * POST
   * /aims/v1/reset_password
   * -d '{"email": "admin@company.com", "return_to": "https://console.alertlogic.net"}' "https://api.cloudinsight.alertlogic.com/aims/v1/reset_password"
   */
  async initiateReset(email: string, returnTo: string) {
    const reset = await this.client.post({
      service_name: this.serviceName,
      path: '/reset_password',
      data: { email, return_to: returnTo },
    });
    return reset;
  }

  /**
   * Reset a user's password using a token
   * PUT
   * /aims/v1/reset_password/:token
   * -d '{"password": "hunter2"}' "https://api.cloudinsight.alertlogic.com/aims/v1/reset_password/69EtspCz3c4"
   */
  async resetWithToken(token: string, password: string) {
    const reset = await this.client.put({
      service_name: this.serviceName,
      path: `/reset_password/${token}`,
      data: { password },
    });
    return reset;
  }

  /**
   * Create a role
   * POST
   * /aims/v1/:account_id/roles
   * -d '{"name": "Super Mega Power User", "permissions": {"*:own:*:*": "allowed", "aims:own:grant:*":"allowed"}}' "https://api.cloudinsight.alertlogic.com/aims/v1/12345678/roles"
   */
  async createRole(accountId: string, name: string, permissions) {
    const createRole = await this.client.post({
      service_name: this.serviceName,
      account_id: accountId,
      path: '/roles',
      data: { name, permissions }
    });
    return createRole as AIMSRole;
  }

  /**
   * Delete a role
   * DELETE
   * /aims/v1/:account_id/roles/:role_id
   * "https://api.cloudinsight.alertlogic.com/aims/v1/12345678/roles/C7C5BE57-F199-4F14-BCB5-43E31CA02842"
   */
  async deleteRole(accountId: string, roleId: string) {
    const roleDelete = await this.client.delete({
      service_name: this.serviceName,
      account_id: accountId,
      path: `/roles/${roleId}`
    });
    return roleDelete;
  }

  /**
   * Get global role, a role that is shared among accounts.
   * GET
   * /aims/v1/roles/:role_id
   * "https://api.cloudinsight.alertlogic.com/aims/v1/roles/2A33175D-86EF-44B5-AA39-C9549F6306DF"
   */
  async getGlobalRole(roleId: string) {
    const role = await this.client.get({
      service_name: this.serviceName,
      path: `/roles/${roleId}`
    });
    return role as AIMSRole;
  }

  /**
   * Get role
   * GET
   * /aims/v1/:account_id/roles/:role_id
   * "https://api.cloudinsight.alertlogic.com/aims/v1/12345678/roles/2A33175D-86EF-44B5-AA39-C9549F6306DF"
   */
  async getAccountRole(accountId: string, roleId: string) {
    const role = await this.client.get({
      service_name: this.serviceName,
      account_id: accountId,
      path: `/roles/${roleId}`
    });
    return role as AIMSRole;
  }

  /**
   * List global roles, roles that are shared among all accounts.
   * GET
   * /aims/v1/roles
   * "https://api.cloudinsight.alertlogic.com/aims/v1/roles"
   */
  async getGlobalRoles():Promise<AIMSRole[]> {
    const roles = await this.client.get({
      service_name: this.serviceName,
      path: '/roles'
    });
    return roles.roles;
  }

  /**
   * List roles for an account. Global roles are included in the list.
   * GET
   * /aims/v1/:account_id/roles
   * "https://api.cloudinsight.alertlogic.com/aims/v1/12345678/roles"
   */
  async getAccountRoles(accountId: string):Promise<AIMSRole[]> {
    const roles = await this.client.get({
      service_name: this.serviceName,
      account_id: accountId,
      path: '/roles'
    });
    return roles.roles as AIMSRole[];
  }

  /**
   * Update Role Name and Permissions
   * POST
   * /aims/v1/:account_id/roles/:role_id
   * -d '{"name": "Mega Power User", "permissions": {"*:own:*:*": "allowed", "aims:own:grant:*":"allowed"}}' "https://api.cloudinsight.alertlogic.com/aims/v1/12345678/roles/2A33175D-86EF-44B5-AA39-C9549F6306DF"
   */
  async updateRole(accountId: string, name: string, permissions) {
    const roleUpdate = await this.client.post({
      service_name: this.serviceName,
      account_id: accountId,
      path: '/roles',
      data: { name, permissions }
    });
    return roleUpdate;
  }
  /**
   * Update Role Name
   * POST
   * /aims/v1/:account_id/roles/:role_id
   * -d '{"name": "Mega Power User"}' "https://api.cloudinsight.alertlogic.com/aims/v1/12345678/roles/2A33175D-86EF-44B5-AA39-C9549F6306DF"
   */
  async updateRoleName(accountId: string, name: string) {
    const updateRole = await this.client.post({
      service_name: this.serviceName,
      account_id: accountId,
      path: '/roles',
      data: { name }
    });
    return updateRole as AIMSRole;
  }
  /**
   * Update Role Permissions
   * POST
   * /aims/v1/:account_id/roles/:role_id
   * -d '{"permissions": {"*:own:*:*": "allowed", "aims:own:grant:*":"allowed"}}' "https://api.cloudinsight.alertlogic.com/aims/v1/12345678/roles/2A33175D-86EF-44B5-AA39-C9549F6306DF"
   */
  async updateRolePermissions(accountId: string, permissions) {
    const updateRole = await this.client.post({
      service_name: this.serviceName,
      account_id: accountId,
      path: '/roles',
      data: { permissions }
    });
    return updateRole as AIMSRole as AIMSRole;
  }

  /**
   * Enroll an MFA device for a user
   * POST
   * /aims/v1/user/mfa/enroll
   *  "https://api.cloudinsight.alertlogic.com/aims/v1/user/mfa/enroll" \
   * -H "Content-Type: application/json" \
   * -H "X-Aims-Session-Token: a3e12fwafge1g9" \
   * -d @- << EOF
   * {
   *    "mfa_uri": "otpauth://totp/Alert%20Logic:admin@company.com?secret=GFZSA5CINFJSA4ZTNNZDG5BAKM2EMMZ7&issuer=Alert%20Logic&algorithm=SHA1"
   *    "mfa_codes": ["123456", "456789"]
   * }
   * EOF
   */
  async enrollMFA(uri: string, codes) {
    const mfa = await this.client.post({
      service_name: this.serviceName,
      path: '/user/mfa/enroll',
      data: { mfa_uri: uri, mfa_codes: codes }
    });
    return mfa;
  }

  /**
   * Remove a user's MFA device
   * DELETE
   * /aims/v1/user/mfa/:email
   * "https://api.cloudinsight.alertlogic.com/aims/v1/user/mfa/admin@company.com"
   */
  async deleteMFA(email: string) {
    const mfa = await this.client.delete({
      service_name: this.serviceName,
      path: `/user/mfa/${email}`,
    });
    return mfa;
  }

  async getUserDetails(accountId: string, userId: string, queryParams?: {include_role_ids?: boolean, include_user_credential?: boolean}) {
    const user = await this.client.get({
      service_name: this.serviceName,
      account_id: accountId,
      path: `/users/${userId}`,
      params: queryParams,
    });
    return user as AIMSUser;
  }

  /**
   * List Users
   * GET
   * /aims/v1/:account_id/users
   * "https://api.cloudinsight.alertlogic.com/aims/v1/12345678/users"
   */
  async getUsers( accountId: string,
                  queryParams?: {include_role_ids?: boolean, include_user_credential?: boolean} ):Promise<AIMSUser[]> {
    const users = await this.client.get({
      service_name: this.serviceName,
      account_id: accountId,
      path: '/users',
      params: queryParams,
    });
    return users.users as AIMSUser[];
  }

  /**
   * Create Access Key
   * POST
   * /aims/v1/:account_id/users/:user_id/access_keys
   * "https://api.cloudinsight.alertlogic.com/aims/v1/12345678/users/715A4EC0-9833-4D6E-9C03-A537E3F98D23/access_keys"
   * -d '{"label": "api access"}'
   */
  async createAccessKey(accountId: string, userId: string, label: string) {
    const key = await this.client.post({
      service_name: this.serviceName,
      account_id: accountId,
      path: `/users/${userId}/access_keys`,
      data: { label }
    });
    return key as AIMSAccessKey;
  }

  /**
   * Update Access Key
   * POST
   * /aims/v1/access_keys/:access_key_id
   * "https://api.cloudinsight.alertlogic.com/aims/v1/access_keys/61fb235617960503"
   * -d '{"label": "api access"}'
   */
  async updateAccessKey(accessKeyId: string, label: string) {
    const key = await this.client.post({
      service_name: this.serviceName,
      path: `/access_keys/${accessKeyId}`,
      data: { label }
    });
    return key as AIMSAccessKey;
  }

  /**
   * Get Access Key
   * GET
   * /aims/v1/access_keys/:access_key_id
   * "https://api.cloudinsight.alertlogic.com/aims/v1/access_keys/61fb235617960503"
   */
  async getAccessKey(accessKeyId: string) {
    const key = await this.client.get({
      service_name: this.serviceName,
      path: `/access_keys/${accessKeyId}`
    });
    return key as AIMSAccessKey;
  }

  /**
   * List Access Keys
   * GET
   * /aims/v1/:account_id/users/:user_id/access_keys?out=:out
   * https://api.cloudinsight.alertlogic.com/aims/v1/12345678/users/715A4EC0-9833-4D6E-9C03-A537E3F98D23/access_keys?out=full"
   */
  async getAccessKeys(accountId: string, userId: string, ttl: number = 60000) {
    const keys = await this.client.get({
      service_name: this.serviceName,
      account_id: accountId,
      ttl: ttl,
      path: `/users/${userId}/access_keys?out=full`
    });
    return keys.access_keys as AIMSAccessKey[];
  }

  /**
   * Delete Access Key
   * DELETE
   * /aims/v1/:account_id/users/:user_id/access_keys/:access_key_id
   * "https://api.cloudinsight.alertlogic.com/aims/v1/12345678/users/715A4EC0-9833-4D6E-9C03-A537E3F98D23/access_keys/61FB235617960503"
   */
  async deleteAccessKey(accountId: string, userId: string, accessKeyId: string) {
    const keyDelete = await this.client.delete({
      service_name: this.serviceName,
      account_id: accountId,
      path: `/users/${userId}/access_keys/${accessKeyId}`
    });
    return keyDelete;
  }

  /**
   * Starts/Refreshes an Endpoints Session
   */
  async startEndpointsSession():Promise<string> {
    const requestDescriptor = {
      service_name: this.serviceName,
      version: 'v1',
      path: '/endpoints_session'
    };
    return await this.client.get( requestDescriptor )
                          .then( responseData => {
                            if ( ! responseData.hasOwnProperty("cookie") ) {
                              return Promise.reject( new AlResponseValidationError( "Unexpected response format: no 'cookie' property present." ) );
                            }
                            return responseData.cookie as string;
                          } );
  }

    /**
     * Retrieve linked organization
     */
  async getAccountOrganization( accountId:string ):Promise<AIMSOrganization> {
      const requestDescriptor = {
          service_name: this.serviceName,
          version: 1,
          account_id: accountId,
          path: '/organization'
      };
      return await this.client.get( requestDescriptor ) as AIMSOrganization;
    }

  /**
   * This endpoint render's an accounts related accounts topologically by adding a :relationship field to the account object,
   * which contains an array of accounts that are directly related to it.
   * GET
   * /aims/v1/:account_id/accounts/:relationship/topology
   * https://console.product.dev.alertlogic.com/api/aims/index.html#api-AIMS_Account_Resources-AccountRelationshipExists
   * @param accountId {string}
   * @param relationship {'managed' | 'managing'}
   * @param queryParms {Object}
   */
  async getAccountRelationshipTopology(accountId: string, relationship: 'managed' | 'managing', queryParams?): Promise<AIMSTopology> {
    const response = await this.client.get({
      service_name: this.serviceName,
      account_id: accountId,
      path: `/accounts/${relationship}/topology`,
      params: queryParams
    });
    return response.topology as AIMSTopology;
  }

  /**
   * Returns the ids of the accounts to which an account is related.
   * The related accounts that are returned depend oonf the :relationship param.
   * If using a "managed" relationship, this returns all accounts that the current account manages.
   * If using a "managing" relationship, this returns all accounts that managing the current account.
   * @param accountId {string}
   * @param relationship {'managed' | 'managing'}
   * @param addCurrentId {boolean} [addCurrentId=true] true if wants add the current id to the return
   */
  async getAccountsIdsByRelationship(accountId: string, relationship: 'managed' | 'managing', addCurrentId: boolean = true): Promise<string[]> {
    const topology = await this.getAccountRelationshipTopology(accountId, relationship);

    function getIds(accounts: AIMSTopology[]): string[] {
      return accounts.flatMap(a => [a.id, ...getIds(Array.isArray(a[relationship]) ? a[relationship] : [])]);
    }
    const first = addCurrentId ? [accountId] : [];
    return [...first, ...getIds(topology[relationship])];
  }

  /**
   * Returns all users associated with a list of accounts
   * @param accountList {string[]}
   */
  async getUsersFromAccounts(accountList: string[]): Promise<AIMSUser[]> {
    return (await Promise.all(
      accountList.map(account => this.getUsers(account, { include_role_ids: false, include_user_credential: false }))
    )).flat();
  }

}

/* tslint:disable:variable-name */
export const AIMSClient = new AIMSClientInstance();
