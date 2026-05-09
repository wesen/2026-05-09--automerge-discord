import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

export interface BootstrapWorkspaceRequest {
  name: string
}

export interface BootstrapWorkspaceResponse {
  workspaceId: string
  workspaceDocUrl: string
  syncUrl: string
  keyhive?: {
    workspaceGroupId: string
    workspaceDocumentId: string
  }
}

export interface CreateInvitationRequest {
  workspaceDocumentId: string
  contactCard: unknown
  access: 'pull' | 'read' | 'comment' | 'edit' | 'admin'
}

export interface CreateInvitationResponse {
  invitationId: string
  mode: 'mock'
  agent: { id: string; kind: 'individual' | 'group' | 'bot' }
  target: { id: string; kind: 'document' }
  access: CreateInvitationRequest['access']
  membershipEventCount: number
  invitation: unknown
}

export interface RevokeInvitationRequest {
  workspaceDocumentId: string
  agent: CreateInvitationResponse['agent']
}

export interface RevokeInvitationResponse {
  mode: 'mock'
  agent: CreateInvitationResponse['agent']
  target: { id: string; kind: 'document' }
  revoked: true
}

export const bootstrapApi = createApi({
  reducerPath: 'bootstrapApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/api/bootstrap' }),
  endpoints: (builder) => ({
    createWorkspace: builder.mutation<BootstrapWorkspaceResponse, BootstrapWorkspaceRequest>({
      query: (body) => ({
        url: '/workspaces',
        method: 'POST',
        body,
      }),
    }),
    createInvitation: builder.mutation<CreateInvitationResponse, CreateInvitationRequest>({
      query: (body) => ({
        url: '/invitations',
        method: 'POST',
        body,
      }),
    }),
    revokeInvitation: builder.mutation<RevokeInvitationResponse, RevokeInvitationRequest>({
      query: (body) => ({
        url: '/invitations/revoke',
        method: 'POST',
        body,
      }),
    }),
  }),
})

export const { useCreateWorkspaceMutation, useCreateInvitationMutation, useRevokeInvitationMutation } = bootstrapApi
