import { google, drive_v3 } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import {
  ShareFileSchema,
  CreateShareLinkSchema,
  ListPermissionsSchema,
  UpdatePermissionSchema,
  RemovePermissionSchema,
} from '../utils/validation.js';
import { handleGoogleApiError, withRetry } from '../utils/error-handler.js';

export class SharingTools {
  private drive: drive_v3.Drive;

  constructor(auth: OAuth2Client) {
    this.drive = google.drive({ version: 'v3', auth });
  }

  async shareFile(params: unknown) {
    const validated = ShareFileSchema.parse(params);

    try {
      const permission: drive_v3.Schema$Permission = {
        type: validated.type,
        role: validated.role,
        ...(validated.emailAddress && { emailAddress: validated.emailAddress }),
      };

      const response = await withRetry(() =>
        this.drive.permissions.create({
          fileId: validated.fileId,
          requestBody: permission,
          sendNotificationEmail: validated.sendNotificationEmail,
          emailMessage: validated.emailMessage,
          fields: 'id, type, role, emailAddress, displayName',
        })
      );

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                success: true,
                permission: {
                  id: response.data.id,
                  type: response.data.type,
                  role: response.data.role,
                  emailAddress: response.data.emailAddress,
                  displayName: response.data.displayName,
                },
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (error) {
      handleGoogleApiError(error);
    }
  }

  async createShareLink(params: unknown) {
    const validated = CreateShareLinkSchema.parse(params);

    try {
      // Create anyone with link permission
      const permission: drive_v3.Schema$Permission = {
        type: 'anyone',
        role: validated.role,
      };

      await withRetry(() =>
        this.drive.permissions.create({
          fileId: validated.fileId,
          requestBody: permission,
        })
      );

      // Get file to retrieve webViewLink
      const fileResponse = await withRetry(() =>
        this.drive.files.get({
          fileId: validated.fileId,
          fields: 'id, name, webViewLink, webContentLink',
        })
      );

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                success: true,
                fileId: validated.fileId,
                fileName: fileResponse.data.name,
                webViewLink: fileResponse.data.webViewLink,
                webContentLink: fileResponse.data.webContentLink,
                role: validated.role,
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (error) {
      handleGoogleApiError(error);
    }
  }

  async listPermissions(params: unknown) {
    const validated = ListPermissionsSchema.parse(params);

    try {
      const response = await withRetry(() =>
        this.drive.permissions.list({
          fileId: validated.fileId,
          fields: 'permissions(id, type, role, emailAddress, displayName, domain, expirationTime, allowFileDiscovery)',
        })
      );

      const permissions = response.data.permissions || [];

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                count: permissions.length,
                permissions: permissions.map((p) => ({
                  id: p.id,
                  type: p.type,
                  role: p.role,
                  emailAddress: p.emailAddress,
                  displayName: p.displayName,
                  domain: p.domain,
                  expirationTime: p.expirationTime,
                  allowFileDiscovery: p.allowFileDiscovery,
                })),
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (error) {
      handleGoogleApiError(error);
    }
  }

  async updatePermission(params: unknown) {
    const validated = UpdatePermissionSchema.parse(params);

    try {
      const response = await withRetry(() =>
        this.drive.permissions.update({
          fileId: validated.fileId,
          permissionId: validated.permissionId,
          requestBody: {
            role: validated.role,
          },
          fields: 'id, type, role, emailAddress, displayName',
        })
      );

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                success: true,
                permission: {
                  id: response.data.id,
                  type: response.data.type,
                  role: response.data.role,
                  emailAddress: response.data.emailAddress,
                  displayName: response.data.displayName,
                },
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (error) {
      handleGoogleApiError(error);
    }
  }

  async removePermission(params: unknown) {
    const validated = RemovePermissionSchema.parse(params);

    try {
      await withRetry(() =>
        this.drive.permissions.delete({
          fileId: validated.fileId,
          permissionId: validated.permissionId,
        })
      );

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                success: true,
                fileId: validated.fileId,
                permissionId: validated.permissionId,
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (error) {
      handleGoogleApiError(error);
    }
  }
}
