import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useCollection } from '../../hooks/useFirestore';
import { Card } from '../../components/UI/Card';
import { Button } from '../../components/UI/Button';
import { Layout } from '../../components/Layout/Layout';
import { 
  BookOpen, 
  Search, 
  Filter, 
  Eye, 
  Globe, 
  Users, 
  Shield,
  Tag
} from 'lucide-react';
import { WikiDoc } from '../../types';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export const Wiki: React.FC = () => {
  const { user } = useAuth();
  const { data: wikiDocs } = useCollection<WikiDoc>('wiki_docs');
  
  const [searchTerm, setSearchTerm] = useState('');
  const [visibilityFilter, setVisibilityFilter] = useState('all');
  const [selectedDoc, setSelectedDoc] = useState<WikiDoc | null>(null);

  // Filter docs based on user permissions
  const accessibleDocs = wikiDocs.filter(doc => {
    if (user?.isAdmin) return true; // Admins can see all docs
    
    switch (doc.visibility) {
      case 'public': return true;
      case 'team': return doc.team === user?.team;
      case 'admin': return user?.isAdmin;
      default: return false;
    }
  });

  const filteredDocs = accessibleDocs.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         doc.markdownContent.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesVisibility = visibilityFilter === 'all' || doc.visibility === visibilityFilter;
    return matchesSearch && matchesVisibility;
  });

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

  if (selectedDoc) {
    return (
      <Layout>
        <div className="p-6 space-y-6">
          {/* Document Header */}
          <div className="flex items-center justify-between">
            <Button
              onClick={() => setSelectedDoc(null)}
              variant="outline"
              className="flex items-center space-x-2"
            >
              ← Back to Wiki
            </Button>
            <span className={`inline-flex items-center space-x-1 px-2 py-1 text-xs font-medium rounded-full border ${getVisibilityColor(selectedDoc.visibility)}`}>
              {getVisibilityIcon(selectedDoc.visibility)}
              <span className="capitalize">{selectedDoc.visibility}</span>
            </span>
          </div>

          {/* Document Content */}
          <Card>
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{selectedDoc.title}</h1>
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <span><strong>Author:</strong> {selectedDoc.author}</span>
                  <span><strong>Updated:</strong> {selectedDoc.updatedAt.toLocaleDateString()}</span>
                  {selectedDoc.team && <span><strong>Team:</strong> {selectedDoc.team}</span>}
                </div>
              </div>

              {selectedDoc.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {selectedDoc.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800"
                    >
                      <Tag className="w-3 h-3 mr-1" />
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              <div className="prose prose-blue max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {selectedDoc.markdownContent}
                </ReactMarkdown>
              </div>
            </div>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Team Wiki</h1>
          <p className="text-gray-600 mt-1">Browse team documentation and knowledge base</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="text-center">
            <div className="flex flex-col items-center space-y-2">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{accessibleDocs.length}</p>
                <p className="text-sm text-gray-600">Available Docs</p>
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
                  {accessibleDocs.filter(d => d.visibility === 'public').length}
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
                  {accessibleDocs.filter(d => d.visibility === 'team').length}
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
                  {accessibleDocs.filter(d => d.visibility === 'admin').length}
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
                  placeholder="Search documents, tags, and content..."
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
                {user?.isAdmin && <option value="admin">Admin Only</option>}
              </select>
            </div>
          </div>
        </Card>

        {/* Documents Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDocs.map((doc) => (
            <Card key={doc.id} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setSelectedDoc(doc)}>
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <h3 className="font-semibold text-gray-900 text-lg line-clamp-2">{doc.title}</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex items-center space-x-1"
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                </div>

                <div className="flex items-center justify-between">
                  <span className={`inline-flex items-center space-x-1 px-2 py-1 text-xs font-medium rounded-full border ${getVisibilityColor(doc.visibility)}`}>
                    {getVisibilityIcon(doc.visibility)}
                    <span className="capitalize">{doc.visibility}</span>
                  </span>
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
                  <p><strong>Updated:</strong> {doc.updatedAt.toLocaleDateString()}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {filteredDocs.length === 0 && (
          <Card className="text-center py-12">
            <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No documents found</h3>
            <p className="text-gray-500">
              {accessibleDocs.length === 0 
                ? "No wiki documents are available to you yet."
                : "No documents match your current search and filters."
              }
            </p>
          </Card>
        )}
      </div>
    </Layout>
  );
};