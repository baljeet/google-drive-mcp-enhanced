import { google, docs_v1 } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { handleGoogleApiError, withRetry } from '../utils/error-handler.js';
import { z } from 'zod';

const ReadDocumentSchema = z.object({
  documentId: z.string(),
});

const UpdateDocumentSchema = z.object({
  documentId: z.string(),
  text: z.string(),
  startIndex: z.number().optional(),
  endIndex: z.number().optional(),
});

const InsertTextSchema = z.object({
  documentId: z.string(),
  text: z.string(),
  index: z.number(),
});

export class DocsTools {
  private docs: docs_v1.Docs;

  constructor(auth: OAuth2Client) {
    this.docs = google.docs({ version: 'v1', auth });
  }

  async readDocument(params: unknown) {
    const validated = ReadDocumentSchema.parse(params);

    try {
      const response = await withRetry(() =>
        this.docs.documents.get({
          documentId: validated.documentId,
        })
      );

      const doc = response.data;

      // Extract text content
      let text = '';
      if (doc.body?.content) {
        for (const element of doc.body.content) {
          if (element.paragraph?.elements) {
            for (const elem of element.paragraph.elements) {
              if (elem.textRun?.content) {
                text += elem.textRun.content;
              }
            }
          }
        }
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                documentId: doc.documentId,
                title: doc.title,
                content: text,
                revisionId: doc.revisionId,
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

  async updateDocument(params: unknown) {
    const validated = UpdateDocumentSchema.parse(params);

    try {
      const requests: docs_v1.Schema$Request[] = [];

      if (validated.startIndex !== undefined && validated.endIndex !== undefined) {
        // Replace text at specific range
        requests.push({
          deleteContentRange: {
            range: {
              startIndex: validated.startIndex,
              endIndex: validated.endIndex,
            },
          },
        });
        requests.push({
          insertText: {
            location: {
              index: validated.startIndex,
            },
            text: validated.text,
          },
        });
      } else {
        // Append text to end of document
        requests.push({
          insertText: {
            location: {
              index: 1,
            },
            text: validated.text,
          },
        });
      }

      const response = await withRetry(() =>
        this.docs.documents.batchUpdate({
          documentId: validated.documentId,
          requestBody: {
            requests,
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
                documentId: validated.documentId,
                replies: response.data.replies,
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

  async insertText(params: unknown) {
    const validated = InsertTextSchema.parse(params);

    try {
      const response = await withRetry(() =>
        this.docs.documents.batchUpdate({
          documentId: validated.documentId,
          requestBody: {
            requests: [
              {
                insertText: {
                  location: {
                    index: validated.index,
                  },
                  text: validated.text,
                },
              },
            ],
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
                documentId: validated.documentId,
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
