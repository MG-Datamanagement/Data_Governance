'use client'

import React, { useState, useEffect, useMemo } from 'react'
import {
  Trash2, Edit2, AlertTriangle, Plus, Filter, TagIcon,
  List, LayoutGrid, CheckCircle2, XCircle, Shield, Tag as TagIconLucide,
  Tag
} from 'lucide-react'
import { useGetTags, useCreateTag, useUpdateTag, useDeleteTag } from '@/hooks/useTagsQueries'
import { useGetOwnersList } from '@/hooks/useDashboardQueries'
import { CreateTagRequest } from '@/types/tagTypes'
import { ApiOwner } from '@/services/dashboardApi.service'
import { useAppStore } from '@/store/appStore'
import { DataGrid, DataGridColumn } from '@/components/ui/DataGrid'
import { Select } from '@/components/ui/Select'
import { Pagination } from '@/components/ui/Pagination'
import { Breadcrumb } from '@/components/ui/Breadcrumb'
import { CardSkeleton } from '@/components/ui/Skeletons'
import { logger } from '@/lib/logger'
import { Tooltip } from '@/components/ui/Tooltip'

// ─── Tag Grid Card ────────────────────────────────────────────────────────────

function TagStatusBadge({ status }: { status: string }) {
  if (status === 'active') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 border border-green-200">
        <CheckCircle2 className="w-3 h-3" />
        Active
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-500 border border-gray-200">
      <XCircle className="w-3 h-3" />
      Inactive
    </span>
  )
}

function TagGridCard({
  tag,
  onEdit,
  onDelete,
}: {
  tag: any
  onEdit: (id: string) => void
  onDelete: (id: string) => void
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col gap-3">
      {/* Card Header: colored dot + name + status badge */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <span
            className="inline-block w-3 h-3 rounded-full flex-shrink-0 mt-0.5"
            style={{ backgroundColor: tag.color }}
          />
          <h3 className="text-base font-bold text-gray-900 leading-tight truncate">{tag.name}</h3>
        </div>
        <TagStatusBadge status={tag.status} />
      </div>

      {/* Description */}
      <p className="text-sm text-gray-500 leading-relaxed line-clamp-2 min-h-[40px]">
        {tag.description || 'No description provided.'}
      </p>

      {/* Type + Security pills */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-full px-2 py-1">
          <Shield className="w-3 h-3 text-gray-500 flex-shrink-0" />
          {tag.tag_type.charAt(0).toUpperCase() + tag.tag_type.slice(1)}
        </span>
        <span className={`inline-flex items-center text-xs font-medium rounded-full px-2 py-1 ${
          tag.security_policy === 'high'
            ? 'bg-red-50 text-red-700'
            : tag.security_policy === 'medium'
              ? 'bg-yellow-50 text-yellow-700'
              : 'bg-green-50 text-green-700'
        }`}>
          {tag.security_policy.charAt(0).toUpperCase() + tag.security_policy.slice(1)} Sensitivity
        </span>
      </div>

      {/* Footer: dataset + column counts + actions */}
      <div className="flex items-center justify-between border-t border-gray-100 pt-3 mt-auto">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center text-xs font-semibold text-indigo-700 bg-indigo-100 rounded-full px-2.5 py-1">
            {tag.dataset_count ?? 0} Datasets
          </span>
          <span className="text-sm text-gray-500">
            {tag.column_count ?? 0} Columns
          </span>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onEdit(tag.id)}
            className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
            title="Edit tag"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDelete(tag.id)}
            className="p-1.5 text-red-500 hover:bg-red-50 rounded-md transition-colors"
            title="Delete tag"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function TagsPage() {
  const { addToast, updateToast } = useAppStore()
  const [showModal, setShowModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [tagToDelete, setTagToDelete] = useState<string | null>(null)
  const [editingTag, setEditingTag] = useState<string | null>(null)
  const [tagName, setTagName] = useState('')
  const [tagType, setTagType] = useState('general')
  const [description, setDescription] = useState('')
  const [securityPolicy, setSecurityPolicy] = useState('medium')
  const [selectedColor, setSelectedColor] = useState('#3B82F6')
  const [status, setStatus] = useState<'active' | 'inactive'>('active')
  const [ownerId, setOwnerId] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [owners, setOwners] = useState<ApiOwner[]>([])
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')

  // React Query hooks
  const { data: tags = [], isLoading, error, refetch } = useGetTags({
    tag_type: typeFilter || undefined,
    status: statusFilter || undefined,
  })
  const createTagMutation = useCreateTag()
  const updateTagMutation = useUpdateTag()
  const deleteTagMutation = useDeleteTag()

  const { data: ownersData } = useGetOwnersList()
  const ownersList = useMemo(() => (ownersData as ApiOwner[]) || [], [ownersData])

  useEffect(() => {
    if (ownersList.length > 0) {
      setOwners(ownersList)
      if (!ownerId) {
        setOwnerId(ownersList[0].id)
      }
    }
  }, [ownersList, ownerId])

  const colors = [
    { name: 'blue', hex: '#3B82F6', class: 'bg-blue-500' },
    { name: 'red', hex: '#EF4444', class: 'bg-red-500' },
    { name: 'orange', hex: '#FB923C', class: 'bg-orange-400' },
    { name: 'green', hex: '#10B981', class: 'bg-green-500' },
    { name: 'purple', hex: '#9C27B0', class: 'bg-purple-500' },
    { name: 'cyan', hex: '#06B6D4', class: 'bg-cyan-500' },
    { name: 'teal', hex: '#14B8A6', class: 'bg-teal-500' },
    { name: 'gray', hex: '#6B7280', class: 'bg-gray-500' }
  ]

  const handleOpenModal = (tagId?: string) => {
    if (tagId) {
      const tag = tags.find((t) => t.id === tagId)
      if (tag) {
        setEditingTag(tagId)
        setTagName(tag.name)
        setTagType(tag.tag_type)
        setDescription(tag.description)
        setSecurityPolicy(tag.security_policy)
        setSelectedColor(tag.color)
        setStatus(tag.status)
        setOwnerId(tag.owner_id)
      }
    } else {
      setEditingTag(null)
      setTagName('')
      setTagType('general')
      setDescription('')
      setSecurityPolicy('medium')
      setSelectedColor('#3B82F6')
      setStatus('active')
      setOwnerId(owners.length > 0 ? owners[0].id : '')
    }
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingTag(null)
    setTagName('')
    setTagType('general')
    setDescription('')
    setSecurityPolicy('medium')
    setSelectedColor('#3B82F6')
    setStatus('active')
    setOwnerId(owners.length > 0 ? owners[0].id : '')
  }

  const handleCreateOrUpdateTag = async () => {
    if (!tagName.trim()) {
      addToast('Please enter a tag name', 'error')
      return
    }

    if (!ownerId) {
      addToast('Please select an owner', 'error')
      return
    }

    const tagData: CreateTagRequest = {
      name: tagName,
      tag_type: tagType,
      description: description,
      security_policy: securityPolicy,
      color: selectedColor,
      status: status,
      owner_id: ownerId,
    }

    const isUpdating = !!editingTag;
    const toastId = addToast(isUpdating ? "Updating tag..." : "Creating tag...", "loading");
    try {
      if (editingTag) {
        await updateTagMutation.mutateAsync({ tagId: editingTag, data: tagData })
      } else {
        await createTagMutation.mutateAsync(tagData)
      }
      updateToast(toastId, isUpdating ? "Tag updated successfully" : "Tag created successfully", "success")
      handleCloseModal()
    } catch (error) {
      logger.error('Error saving tag:', error)
      updateToast(toastId, 'Failed to save tag. Please try again.', 'error')
    }
  }

  const handleDeleteTag = async (tagId: string) => {
    setTagToDelete(tagId)
    setShowDeleteModal(true)
  }

  const confirmDeleteTag = async () => {
    if (!tagToDelete) return
    const toastId = addToast('Deleting tag...', 'loading')
    try {
      await deleteTagMutation.mutateAsync(tagToDelete)
      updateToast(toastId, 'Tag deleted successfully', 'success')
      setShowDeleteModal(false)
      setTagToDelete(null)
    } catch (error) {
      logger.error('Error deleting tag:', error)
      updateToast(toastId, 'Failed to delete tag. Please try again.', 'error')
    }
  }

  const cancelDelete = () => {
    setShowDeleteModal(false)
    setTagToDelete(null)
  }

  const filteredTags = tags.filter((tag) => {
    const matchesSearch = tag.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tag.description.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesSearch
  })

  // Reset to page 1 when filters change
  useEffect(() => { setPage(1) }, [filteredTags.length])

  const paginatedTags = useMemo(() => {
    const start = (page - 1) * pageSize
    return filteredTags.slice(start, start + pageSize)
  }, [filteredTags, page, pageSize])

  const columns: DataGridColumn<any>[] = [
    {
      key: "name",
      header: "Tag Name",
      render: (tag: any) => (
        <div className="flex items-center gap-3">
          <span
            className="inline-block w-3 h-3 rounded-full flex-shrink-0"
            style={{ backgroundColor: tag.color }}
          />
          <span className="text-sm font-medium text-gray-900">{tag.name}</span>
        </div>
      )
    },
    {
      key: "type",
      header: "Type",
      render: (tag: any) => (
        <span className="inline-flex items-center gap-1.5 text-xs text-gray-700 border border-gray-200 rounded-full px-2 py-0.5">
          <div>
            <Tag className="w-3 h-3 text-gray-500" />
          </div>
          {tag.tag_type}
        </span>
      )
    },
    {
      key: "description",
      header: "Description",
      render: (tag: any) => {
        return(
          <Tooltip content={tag.description} >
            <p className="text-sm text-gray-600 line-clamp-1 truncate max-w-xs">{tag.description}</p>
          </Tooltip>
        )
      }
    },
    {
      key: "status",
      header: "Status",
      render: (tag: any) => (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${
          tag.status === 'active'
            ? 'bg-green-100 text-green-700'
            : 'bg-gray-100 text-gray-600'
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${
            tag.status === 'active' ? 'bg-green-600' : 'bg-gray-600'
          }`} />
          {tag.status}
        </span>
      )
    },
    {
      key: "security",
      header: "Security",
      render: (tag: any) => (
        <span className={`inline-block px-2 py-1 text-xs font-medium rounded ${
          tag.security_policy === 'high' ? 'bg-red-100 text-red-700' :
          tag.security_policy === 'medium' ? 'bg-yellow-100 text-yellow-700' :
          'bg-green-100 text-green-700'
        }`}>
          {tag.security_policy}
        </span>
      )
    },
    {
      key: "actions",
      header: "Actions",
      render: (tag: any) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleOpenModal(tag.id)}
            className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
            title="Edit tag"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDeleteTag(tag.id)}
            className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
            title="Delete tag"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">

        {/* Breadcrumb */}
        <Breadcrumb items={[
          { label: 'Home', href: '/' },
          { label: 'Governance' },
          { label: 'Tags' },
        ]} />

        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-2">
              <TagIcon className="w-6 h-6 text-indigo-600" />
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Tag Management</h1>
            </div>
            <p className="text-sm text-gray-500 mt-1">Configure and manage global tags for data classification, privacy, and retention.</p>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors text-sm font-semibold"
          >
            <Plus className="w-4 h-4" />
            Create Tag
          </button>
        </div>

        {/* Search, Filters, and View Toggle */}
        <div className="bg-white p-4 rounded-lg shadow-sm mb-6 border border-gray-200">
          {/* Search row */}
          <div className="flex-1 relative w-full mb-4">
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 pl-10 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
              placeholder="Search tags by name or description..."
            />
            <svg className="w-5 h-5 text-gray-400 absolute left-3 top-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* Filters + view toggle row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-600">Filters:</span>
              </div>
              <Select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-40 bg-white"
                placeholder=""
                options={[
                  { value: "", label: "All Types" },
                  { value: "privacy", label: "Privacy" },
                  { value: "classification", label: "Classification" },
                  { value: "retention", label: "Retention" },
                  { value: "general", label: "General" }
                ]}
              />
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-40 bg-white"
                placeholder=""
                options={[
                  { value: "", label: "All Statuses" },
                  { value: "active", label: "Active" },
                  { value: "inactive", label: "Inactive" }
                ]}
              />
            </div>

            {/* List / Grid toggle */}
            <div className="flex items-center border border-gray-200 rounded-lg p-0.5 bg-gray-50">
              <button
                onClick={() => setViewMode("list")}
                className={`p-1.5 rounded-md transition-colors ${viewMode === 'list' ? 'bg-white shadow-sm text-gray-700' : 'text-gray-400 hover:bg-gray-100'}`}
                title="List view"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("grid")}
                className={`p-1.5 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-white shadow-sm text-gray-700' : 'text-gray-400 hover:bg-gray-100'}`}
                title="Grid view"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Content: List view */}
        {viewMode === 'list' && (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
            <DataGrid
              data={paginatedTags}
              columns={columns}
              isLoading={isLoading}
              keyExtractor={(tag: any) => tag.id}
              emptyStateMessage={error ? "Failed to load tags." : "No tags found. Create your first tag to get started."}
              className="border-none shadow-none rounded-none"
              pagination={
                filteredTags.length > pageSize ? (
                  <Pagination
                    currentPage={page}
                    totalItems={filteredTags.length}
                    pageSize={pageSize}
                    pageSizeOptions={[10, 20, 50]}
                    showCount
                    onPageChange={setPage}
                    onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
                  />
                ) : undefined
              }
            />
          </div>
        )}

        {/* Content: Grid view */}
        {viewMode === 'grid' && (
          isLoading ? (
            /* Loading skeleton grid */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {Array.from({ length: 6 }).map((_, i) => (
                <CardSkeleton key={i} />
              ))}
            </div>
          ) : filteredTags.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-16 text-center">
              <TagIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" strokeWidth={1.5} />
              <p className="text-gray-500 font-medium">{error ? "Failed to load tags." : "No tags found."}</p>
              <p className="text-gray-400 text-sm mt-1">{error ? "Please try refreshing the page." : "Create your first tag to get started."}</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {paginatedTags.map((tag: any) => (
                  <TagGridCard
                    key={tag.id}
                    tag={tag}
                    onEdit={handleOpenModal}
                    onDelete={handleDeleteTag}
                  />
                ))}
              </div>
              {/* Grid pagination */}
              {filteredTags.length > pageSize && (
                <div className="mt-5 bg-white rounded-lg border border-gray-200 shadow-sm px-4 py-2">
                  <Pagination
                    currentPage={page}
                    totalItems={filteredTags.length}
                    pageSize={pageSize}
                    pageSizeOptions={[10, 20, 50]}
                    showCount
                    onPageChange={setPage}
                    onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
                  />
                </div>
              )}
            </>
          )
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4">
            <div className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Delete Tag</h2>
                  <p className="text-sm text-gray-600 mt-1">This action cannot be undone</p>
                </div>
              </div>

              <p className="text-gray-700 mb-6">
                Are you sure you want to delete this tag? This will remove the tag from all associated datasets and columns.
              </p>

              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={cancelDelete}
                  disabled={deleteTagMutation.isPending}
                  className="px-6 py-2.5 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors font-medium disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmDeleteTag}
                  disabled={deleteTagMutation.isPending}
                  className="px-6 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50"
                >
                  {deleteTagMutation.isPending ? 'Deleting...' : 'Delete Tag'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Tag Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {editingTag ? 'Edit Tag' : 'Create New Tag'}
                </h2>
                <p className="text-sm text-gray-600 mt-1">Define the properties and policies for this tag.</p>
              </div>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="tagName" className="block text-sm font-medium text-gray-700 mb-2">
                    Tag Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="tagName"
                    type="text"
                    value={tagName}
                    onChange={(e) => setTagName(e.target.value)}
                    placeholder="e.g. PII, Confidential"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label htmlFor="tagType" className="block text-sm font-medium text-gray-700 mb-2">
                    Tag Type
                  </label>
                  <Select
                    id="tagType"
                    value={tagType}
                    onChange={(e) => setTagType(e.target.value)}
                    className="w-full bg-white"
                    options={[
                      { value: "general", label: "General" },
                      { value: "privacy", label: "Privacy" },
                      { value: "classification", label: "Classification" },
                      { value: "retention", label: "Retention" }
                    ]}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe when and how this tag should be applied..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="securityPolicy" className="block text-sm font-medium text-gray-700 mb-2">
                    Security Policy
                  </label>
                  <Select
                    id="securityPolicy"
                    value={securityPolicy}
                    onChange={(e) => setSecurityPolicy(e.target.value)}
                    className="w-full bg-white"
                    options={[
                      { value: "low", label: "Low" },
                      { value: "medium", label: "Medium" },
                      { value: "high", label: "High" }
                    ]}
                  />
                </div>
                <div>
                  <label htmlFor="owner" className="block text-sm font-medium text-gray-700 mb-2">
                    Owner <span className="text-red-500">*</span>
                  </label>
                  <Select
                    id="owner"
                    value={ownerId}
                    onChange={(e) => setOwnerId(e.target.value)}
                    className="w-full bg-white cursor-pointer"
                    placeholder="Select an owner"
                    options={owners.map((owner) => ({
                      value: owner.id,
                      label: owner.name
                    }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="block text-sm font-medium text-gray-700 mb-3">
                    Color Indicator
                  </span>
                  <div className="flex gap-2">
                    {colors.map((color) => (
                      <button
                        key={color.name}
                        type="button"
                        onClick={() => setSelectedColor(color.hex)}
                        className={`w-8 h-8 rounded-full ${color.class} ${
                          selectedColor === color.hex
                            ? 'ring-2 ring-offset-2 ring-gray-400'
                            : 'hover:ring-2 hover:ring-offset-2 hover:ring-gray-300'
                        } transition-all`}
                      />
                    ))}
                  </div>
                </div>
                <div>
                  <span className="block text-sm font-medium text-gray-700 mb-3">
                    Status
                  </span>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setStatus('active')}
                      className={`flex-1 py-2 px-4 rounded-lg border-2 transition-colors ${
                        status === 'active'
                          ? 'border-green-500 bg-green-50 text-green-700 font-medium'
                          : 'border-gray-300 text-gray-700 hover:border-gray-400'
                      }`}
                    >
                      Active
                    </button>
                    <button
                      type="button"
                      onClick={() => setStatus('inactive')}
                      className={`flex-1 py-2 px-4 rounded-lg border-2 transition-colors ${
                        status === 'inactive'
                          ? 'border-gray-500 bg-gray-50 text-gray-700 font-medium'
                          : 'border-gray-300 text-gray-700 hover:border-gray-400'
                      }`}
                    >
                      Inactive
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 flex-shrink-0">
              <button
                type="button"
                onClick={handleCloseModal}
                className="px-6 py-2.5 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateOrUpdateTag}
                disabled={createTagMutation.isPending || updateTagMutation.isPending}
                className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium disabled:opacity-50"
              >
                {createTagMutation.isPending || updateTagMutation.isPending
                  ? 'Saving...'
                  : editingTag ? 'Update Tag' : 'Create Tag'
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
