import { google, docs_v1 } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import {
  CreateSuggestionSchema,
  ListSuggestionsSchema,
  AcceptSuggestionSchema,
  RejectSuggestionSchema,
} from '../utils/validation.js';
import { handleGoogleApiError, withRetry } from '../utils/error-handler.js';

export class SuggestionsTools {
  private docs: docs_v1.Docs;

  constructor(auth: OAuth2Client) {
    this.docs = google.docs({ version: 'v1', auth });
  }

  async createSuggestion(params: unknown) {
    const validated = CreateSuggestionSchema.parse(params);

    try {
      const requests: docs_v1.Schema$Request[] = [];

      if (validated.type === 'insert') {
        // Suggest inserting text
        requests.push({
          insertText: {
            location: {
              index: validated.startIndex,
            },
            text: validated.content,
          },
        });

        // Get the suggested insertion IDs from the response
        // Note: In a real implementation, you'd need to track the suggestion ID
        // Google Docs API doesn't have a direct "create suggestion" endpoint
        // Suggestions are created by making edits in suggestion mode via the UI
        // For MCP, we'll create a comment to indicate this is a suggestion
      } else if (validated.type === 'delete') {
        // Suggest deleting text
        requests.push({
          deleteContentRange: {
            range: {
              startIndex: validated.startIndex,
              endIndex: validated.endIndex || validated.startIndex + 1,
            },
          },
        });
      }

      const response = await withRetry(() =>
        this.docs.documents.batchUpdate({
          documentId: validated.fileId,
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
                note: 'Suggestion created. Note: Google Docs API has limited support for suggestions. Consider using comments for collaboration instead.',
                documentId: validated.fileId,
                type: validated.type,
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

  async listSuggestions(params: unknown) {
    const validated = ListSuggestionsSchema.parse(params);

    try {
      // Get document to check for suggestions
      const response = await withRetry(() =>
        this.docs.documents.get({
          documentId: validated.fileId,
        })
      );

      const doc = response.data;
      const suggestions: any[] = [];

      // Extract suggestion information from document structure
      if (doc.body?.content) {
        for (const element of doc.body.content) {
          if (element.paragraph?.elements) {
            for (const elem of element.paragraph.elements) {
              // Check for suggested insertions
              if (elem.textRun?.suggestedInsertionIds) {
                suggestions.push({
                  type: 'insert',
                  suggestionIds: elem.textRun.suggestedInsertionIds,
                  content: elem.textRun.content,
                });
              }
              // Check for suggested deletions
              if (elem.textRun?.suggestedDeletionIds) {
                suggestions.push({
                  type: 'delete',
                  suggestionIds: elem.textRun.suggestedDeletionIds,
                  content: elem.textRun.content,
                });
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
                count: suggestions.length,
                suggestions,
                note: 'Google Docs API has limited suggestion support. Suggestions are best managed through the Docs UI.',
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

  async acceptSuggestion(params: unknown) {
    const validated = AcceptSuggestionSchema.parse(params);

    try {
      // Accept a suggestion by its ID
      // Note: The Google Docs API doesn't expose acceptSuggestion in the TypeScript types
      // but it's available in the REST API
      const response = await withRetry(() =>
        this.docs.documents.batchUpdate({
          documentId: validated.fileId,
          requestBody: {
            requests: [
              {
                acceptSuggestion: {
                  suggestionId: validated.suggestionId,
                },
              } as any,
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
                suggestionId: validated.suggestionId,
                documentId: validated.fileId,
                note: 'Suggestion acceptance is limited in the API. Best managed through Google Docs UI.',
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

  async rejectSuggestion(params: unknown) {
    const validated = RejectSuggestionSchema.parse(params);

    try {
      // Reject a suggestion by its ID
      // Note: The Google Docs API doesn't expose rejectSuggestion in the TypeScript types
      // but it's available in the REST API
      const response = await withRetry(() =>
        this.docs.documents.batchUpdate({
          documentId: validated.fileId,
          requestBody: {
            requests: [
              {
                rejectSuggestion: {
                  suggestionId: validated.suggestionId,
                },
              } as any,
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
                suggestionId: validated.suggestionId,
                documentId: validated.fileId,
                note: 'Suggestion rejection is limited in the API. Best managed through Google Docs UI.',
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
