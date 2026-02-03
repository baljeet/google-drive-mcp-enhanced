import { google, sheets_v4 } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { handleGoogleApiError, withRetry } from '../utils/error-handler.js';
import { z } from 'zod';

const ReadSheetSchema = z.object({
  spreadsheetId: z.string(),
  range: z.string().optional(),
});

const UpdateSheetSchema = z.object({
  spreadsheetId: z.string(),
  range: z.string(),
  values: z.array(z.array(z.any())),
});

const GetSheetMetadataSchema = z.object({
  spreadsheetId: z.string(),
});

export class SheetsTools {
  private sheets: sheets_v4.Sheets;

  constructor(auth: OAuth2Client) {
    this.sheets = google.sheets({ version: 'v4', auth });
  }

  async getMetadata(params: unknown) {
    const validated = GetSheetMetadataSchema.parse(params);

    try {
      const response = await withRetry(() =>
        this.sheets.spreadsheets.get({
          spreadsheetId: validated.spreadsheetId,
        })
      );

      const spreadsheet = response.data;

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                spreadsheetId: spreadsheet.spreadsheetId,
                title: spreadsheet.properties?.title,
                locale: spreadsheet.properties?.locale,
                timeZone: spreadsheet.properties?.timeZone,
                sheets: spreadsheet.sheets?.map((sheet) => ({
                  sheetId: sheet.properties?.sheetId,
                  title: sheet.properties?.title,
                  index: sheet.properties?.index,
                  gridProperties: sheet.properties?.gridProperties,
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

  async readSheet(params: unknown) {
    const validated = ReadSheetSchema.parse(params);

    try {
      const response = await withRetry(() =>
        this.sheets.spreadsheets.values.get({
          spreadsheetId: validated.spreadsheetId,
          range: validated.range || 'A1:Z1000',
        })
      );

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                range: response.data.range,
                values: response.data.values || [],
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

  async updateSheet(params: unknown) {
    const validated = UpdateSheetSchema.parse(params);

    try {
      const response = await withRetry(() =>
        this.sheets.spreadsheets.values.update({
          spreadsheetId: validated.spreadsheetId,
          range: validated.range,
          valueInputOption: 'USER_ENTERED',
          requestBody: {
            values: validated.values,
          },
        })
      );

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                success: true,
                spreadsheetId: validated.spreadsheetId,
                updatedRange: response.data.updatedRange,
                updatedRows: response.data.updatedRows,
                updatedColumns: response.data.updatedColumns,
                updatedCells: response.data.updatedCells,
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
