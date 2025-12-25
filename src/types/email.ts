export interface GmailEmail {
  id: string;
  threadId: string;
  from: string;
  to?: string;
  subject: string;
  date: string;
  snippet: string;
  body?: string;
  isUnread: boolean;
  isStarred: boolean;
  labels: string[];
  hasAttachment?: boolean;
}

export interface EmailListResponse {
  success: boolean;
  data: GmailEmail[];
  nextPageToken?: string;
  resultSizeEstimate?: number;
}

export interface EmailDetailResponse {
  success: boolean;
  data: GmailEmail;
}

export interface SendEmailRequest {
  to: string;
  subject: string;
  body: string;
  cc?: string;
  bcc?: string;
}

export interface EmailFilters {
  labelIds?: string[];
  query?: string;
  limit?: number;
  pageToken?: string;
}

export interface EmailLabel {
  id: string;
  name: string;
  type: string;
  messagesTotal: number;
  messagesUnread: number;
}

export interface EmailStats {
  inbox: number;
  unread: number;
  starred: number;
  sent: number;
  drafts: number;
  spam: number;
  trash: number;
}

