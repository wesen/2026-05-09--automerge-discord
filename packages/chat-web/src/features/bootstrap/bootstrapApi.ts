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
  }),
})

export const { useCreateWorkspaceMutation } = bootstrapApi
