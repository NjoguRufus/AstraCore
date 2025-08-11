import React, { useState } from 'react';
import { useCollection } from '../../hooks/useFirestore';
import { createWikiDoc, updateWikiDoc, deleteWikiDoc } from '../../services/firebaseService';
import { Card } from '../../components/UI/Card';
import { Button } from '../../components/UI/Button';
import { Layout } from '../../components/Layout/Layout';
import { 
  BookOpen, 
  Plus, 
  Edit, 
  Trash2, 
  Search,
  Filter,
  Eye,
  Globe,
  Users,
  Shield
} from 'lucide-react';
import { WikiDoc } from '../../types';

export const WikiManagement: React.FC = () => {
  const { data: wikiDocs } = useCollection<WikiDoc>('wiki_docs');
  
  const [searchTerm, setSearchTerm] = useState('');
  const [visibilityFilter, setVisibilityFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingDoc, setEditingDoc] = useState<WikiDoc | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const [docForm, setDocForm] = useState({
    title: '',
    markdownContent: '',
    tags: [] as string[],
    team: '',
    visibility: 'public' as 'public' | 'team' | 'admin',
    author: ''
  });

  const [tagInput, setTagInput] = useState('');

  const filteredDocs = wikiDocs.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesVisibility = visibilityFilter === 'all' || doc.visibility === visibilityFilter;
    return matchesSearch && matchesVisibility;
  });

  const handleCreateDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docForm.title || !docForm.markdownContent) return;

    setIsLoading(true);
    try {
      await createWikiDoc({
        ...docForm,
        author: 'Admin' // In a real app, this would be the current user's name
      });

      setDocForm({
        title: '',
        markdownContent: '',
        tags: [],
        team: '',
        visibility: 'public',
        author: ''
      });
      setShowCreateModal(false);
    } catch (error) {
      console.error('Error creating wiki doc:', error);
      alert('Failed to create wiki document. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDoc) return;

    setIsLoading(true);
    try {
      await updateWikiDoc(editingDoc.id, docForm);

      setEditingDoc(null);
      setDocForm({
        title: '',
        markdownContent: '',
        tags: [],
        team: '',
        visibility: 'public',
        author: ''
      });
      setShowCreateModal(false);
    } catch (error) {
      console.error('Error updating wiki doc:', error);
      alert('Failed to update wiki document. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteDoc = async (docId: string) => {
    if (!confirm('Are you sure you want to delete this wiki document?')) return;

    try {
      await deleteWikiDoc(docId);
    } catch (error) {
      console.error('Error deleting wiki doc:', error);
      alert('Failed to delete wiki document. Please try again.');
    }
  };

  const startEditDoc = (doc: WikiDoc) => {
    setEditingDoc(doc);
    setDocForm({
      title: doc.title,
      markdownContent: doc.markdownContent,
      tags: doc.tags,
      team: doc.team || '',
      visibility: doc.visibility,
      author: doc.author
    });
    setShowCreateModal(true);
  };

  const addTag = () => {
    if (tagInput.trim() && !docForm.tags.includes(tagInput.trim())) {
      setDocForm(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setDocForm(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const getVisibilityColor = (visibility: string) => {
    switch (visibility) {
      case 'public': return 'bg-green-100 text-green-800 border-green-200';
      case 'team': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'admin': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getVisibilityIcon = (visibility: string) => {
    switch (visibility) {
      case 'public': return <Globe className="w-4 h-4" />;
      case 'team': return <Users className="w-4 h-4" />;
      case 'admin': return <Shield className="w-4 h-4" />;
      default: return null;
    }
  };

  return (
    <Layout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Wiki Management</h1>
            <p className="text-gray-600 mt-1">Create and manage team documentation</p>
          </div>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>New Document</span>
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="text-center">
            <div className="flex flex-col items-center space-y-2">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{wikiDocs.length}</p>
                <p className="text-sm text-gray-600">Total Docs</p>
              </div>
            </div>
          </Card>

          <Card className="text-center">
            <div className="flex flex-col items-center space-y-2">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <Globe className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">
                  {wikiDocs.filter(d => d.visibility === 'public').length}
                </p>
                <p className="text-sm text-gray-600">Public</p>
              </div>
            </div>
          </Card>

          <Card className="text-center">
            <div className="flex flex-col items-center space-y-2">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-600">
                  {wikiDocs.filter(d => d.visibility === 'team').length}
                </p>
                <p className="text-sm text-gray-600">Team Only</p>
              </div>
            </div>
          </Card>

          <Card className="text-center">
            <div className="flex flex-col items-center space-y-2">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <Shield className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-red-600">
                  {wikiDocs.filter(d => d.visibility === 'admin').length}
                </p>
                <p className="text-sm text-gray-600">Admin Only</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search documents and tags..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={visibilityFilter}
                onChange={(e) => setVisibilityFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Visibility</option>
                <option value="public">Public</option>
                <option value="team">Team Only</option>
                <option value="admin">Admin Only</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Documents Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDocs.map((doc) => (
            <Card key={doc.id} className="hover:shadow-lg transition-shadow">
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <h3 className="font-semibold text-gray-900 text-lg line-clamp-2">{doc.title}</h3>
                  <div className="flex items-center space-x-1">
                    <Button
                      onClick={() => startEditDoc(doc)}
                      variant="ghost"
                      size="sm"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      onClick={() => handleDeleteDoc(doc.id)}
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className={`inline-flex items-center space-x-1 px-2 py-1 text-xs font-medium rounded-full border ${getVisibilityColor(doc.visibility)}`}>
                    {getVisibilityIcon(doc.visibility)}
                    <span className="capitalize">{doc.visibility}</span>
                  </span>
                  <div className="flex items-center space-x-1 text-sm text-gray-500">
                    <Eye className="w-4 h-4" />
                    <span>View</span>
                  </div>
                </div>

                {doc.team && (
                  <div className="text-sm text-gray-500">
                    <strong>Team:</strong> {doc.team}
                  </div>
                )}

                <div className="flex flex-wrap gap-1">
                  {doc.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800"
                    >
                      {tag}
                    </span>
                  ))}
                  {doc.tags.length > 3 && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800">
                      +{doc.tags.length - 3} more
                    </span>
                  )}
                </div>

                <div className="text-sm text-gray-500">
                  <p><strong>Author:</strong> {doc.author}</p>
                  <p><strong>Updated:</strong> {doc.updatedAt ? doc.updatedAt.toLocaleDateString() : 'No date'}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {filteredDocs.length === 0 && (
          <Card className="text-center py-12">
            <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No documents found</h3>
            <p className="text-gray-500 mb-4">Get started by creating your first wiki document.</p>
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Document
            </Button>
          </Card>
        )}

        {/* Create/Edit Document Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                {editingDoc ? 'Edit Document' : 'Create New Document'}
              </h2>
              <form onSubmit={editingDoc ? handleUpdateDoc : handleCreateDoc} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title
                  </label>
                  <input
                    type="text"
                    value={docForm.title}
                    onChange={(e) => setDocForm(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Content (Markdown)
                  </label>
                  <textarea
                    value={docForm.markdownContent}
                    onChange={(e) => setDocForm(prev => ({ ...prev, markdownContent: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={8}
                    placeholder="Write your content in Markdown format..."
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Visibility
                    </label>
                    <select
                      value={docForm.visibility}
                      onChange={(e) => setDocForm(prev => ({ ...prev, visibility: e.target.value as any }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="public">Public</option>
                      <option value="team">Team Only</option>
                      <option value="admin">Admin Only</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Team (optional)
                    </label>
                    <input
                      type="text"
                      value={docForm.team}
                      onChange={(e) => setDocForm(prev => ({ ...prev, team: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., Frontend Team"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tags
                  </label>
                  <div className="flex space-x-2 mb-3">
                    <input
                      type="text"
                      placeholder="Add a tag"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <Button type="button" onClick={addTag} variant="outline">
                      Add
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {docForm.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="ml-2 text-blue-600 hover:text-blue-800"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex space-x-3 pt-4">
                  <Button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      setEditingDoc(null);
                      setDocForm({
                        title: '',
                        markdownContent: '',
                        tags: [],
                        team: '',
                        visibility: 'public',
                        author: ''
                      });
                    }}
                    variant="outline"
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    isLoading={isLoading}
                    className="flex-1"
                  >
                    {editingDoc ? 'Update' : 'Create'} Document
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};