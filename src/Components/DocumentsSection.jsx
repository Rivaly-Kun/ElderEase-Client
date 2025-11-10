import React, { useState, useMemo } from "react";
import {
  Download,
  Upload,
  X,
  File,
  FileText,
  Image,
  Folder,
  FolderOpen,
  Trash2,
  Eye,
} from "lucide-react";

const DocumentsSection = ({
  memberDocuments,
  memberDocumentsLoading,
  documentCategories,
  documentCategoriesLoading,
  showDocumentUploadModal,
  setShowDocumentUploadModal,
  selectedDocumentCategory,
  setSelectedDocumentCategory,
  documentUploadFile,
  setDocumentUploadFile,
  documentUploadLoading,
  handleDocumentUpload,
  handleViewDocument,
  memberData,
}) => {
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [documentUploadFiles, setDocumentUploadFiles] = useState([]);

  // Group documents by category
  const documentsByCategory = useMemo(() => {
    const grouped = {};
    documentCategories.forEach((cat) => {
      grouped[cat.id] = {
        category: cat,
        documents: memberDocuments.filter((doc) => doc.categoryId === cat.id),
      };
    });
    return grouped;
  }, [memberDocuments, documentCategories]);

  const getFileIcon = (contentType) => {
    if (contentType?.includes("image"))
      return <Image className="w-5 h-5 text-blue-600" />;
    if (contentType?.includes("pdf"))
      return <FileText className="w-5 h-5 text-red-600" />;
    return <File className="w-5 h-5 text-gray-600" />;
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  if (memberDocumentsLoading || documentCategoriesLoading) {
    return (
      <div className="p-8 flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading documents...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 rounded-3xl shadow-lg p-8 text-white">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <h2 className="text-4xl font-bold mb-3">📁 My Documents</h2>
              <p className="text-blue-100 text-lg">
                Organize your documents by category. Each folder can contain up
                to 5 files (images, PDFs, docs).
              </p>
            </div>
            <button
              onClick={() => {
                setShowDocumentUploadModal(true);
                setSelectedDocumentCategory(null);
                setDocumentUploadFiles([]);
              }}
              className="px-8 py-4 bg-white text-purple-600 rounded-2xl hover:bg-gray-100 transition font-bold flex items-center gap-3 whitespace-nowrap shadow-lg text-lg"
            >
              <Upload className="w-6 h-6" />
              Upload Files
            </button>
          </div>
        </div>

        {/* Search Bar */}
        {documentCategories.length > 0 && memberDocuments.length > 0 && (
          <div className="bg-white rounded-2xl border-2 border-gray-200 p-6 shadow-md">
            <label className="block text-sm font-bold text-gray-700 mb-3 uppercase">
              🔍 Search Files
            </label>
            <input
              type="text"
              placeholder="Search by file name, category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-5 py-3 border-2 border-gray-300 rounded-xl bg-white text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition"
            />
          </div>
        )}

        {/* Document Folders */}
        {documentCategories.length > 0 ? (
          <div className="space-y-4">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">
              📚 Your Document Folders
            </h3>
            <div className="grid grid-cols-1 gap-4">
              {documentCategories.map((category) => {
                const categoryData = documentsByCategory[category.id];
                const documentCount = categoryData.documents.length;
                const isExpanded = expandedCategory === category.id;

                return (
                  <div
                    key={category.id}
                    className="bg-white rounded-2xl border-2 border-gray-200 overflow-hidden hover:border-purple-300 transition shadow-md"
                  >
                    {/* Folder Header */}
                    <div
                      onClick={() =>
                        setExpandedCategory(isExpanded ? null : category.id)
                      }
                      className="w-full p-6 flex items-center justify-between hover:bg-gray-50 transition group cursor-pointer"
                    >
                      <div className="flex items-center gap-4 flex-1 text-left">
                        <div className="text-4xl">
                          {isExpanded ? "📂" : "📁"}
                        </div>
                        <div className="flex-1">
                          <h4 className="text-xl font-bold text-gray-900 capitalize group-hover:text-purple-600 transition">
                            {category.name}
                          </h4>
                          {category.note && (
                            <p className="text-sm text-gray-600 mt-1">
                              {category.note}
                            </p>
                          )}
                          <div className="flex items-center gap-3 mt-2">
                            <p className="text-sm font-semibold text-purple-600">
                              📄 {documentCount}/5 files
                            </p>
                            {documentCount >= 5 && (
                              <span className="inline-block px-2 py-1 bg-orange-100 text-orange-700 text-xs font-bold rounded-full">
                                ⚠️ FULL
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (documentCount >= 5) {
                            alert(
                              "This folder is full! Maximum 5 files per category."
                            );
                            return;
                          }
                          setSelectedDocumentCategory(category);
                          setShowDocumentUploadModal(true);
                        }}
                        disabled={documentCount >= 5}
                        className={`px-5 py-2 rounded-lg transition font-semibold flex items-center gap-2 text-sm flex-shrink-0 ml-4 ${
                          documentCount >= 5
                            ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                            : "bg-purple-600 text-white hover:bg-purple-700"
                        }`}
                      >
                        <Upload className="w-4 h-4" />
                        Add Files
                      </button>
                    </div>

                    {/* Folder Contents */}
                    {isExpanded && documentCount > 0 && (
                      <div className="border-t-2 border-gray-200 bg-gray-50 p-6">
                        <div className="space-y-3">
                          {categoryData.documents
                            .filter(
                              (doc) =>
                                searchQuery === "" ||
                                doc.name
                                  .toLowerCase()
                                  .includes(searchQuery.toLowerCase()) ||
                                category.name
                                  .toLowerCase()
                                  .includes(searchQuery.toLowerCase())
                            )
                            .map((doc) => (
                              <div
                                key={doc.id}
                                className="flex items-center justify-between p-4 bg-white rounded-xl border-2 border-gray-200 hover:border-purple-300 hover:shadow-md transition group"
                              >
                                <div className="flex items-center gap-4 flex-1 min-w-0">
                                  <div className="p-3 bg-gray-100 rounded-lg group-hover:bg-purple-100 transition flex-shrink-0">
                                    {getFileIcon(doc.contentType)}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-gray-900 truncate text-sm">
                                      {doc.name}
                                    </p>
                                    <div className="flex items-center gap-3 mt-1">
                                      <span className="text-xs text-gray-600">
                                        {formatFileSize(doc.size)}
                                      </span>
                                      <span className="text-xs text-gray-500">
                                        📅{" "}
                                        {new Date(
                                          doc.uploadedAt
                                        ).toLocaleDateString()}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 ml-2">
                                  {doc.downloadURL && (
                                    <>
                                      <button
                                        onClick={() => handleViewDocument(doc)}
                                        className="p-2 text-purple-600 hover:bg-purple-100 rounded-lg transition flex-shrink-0"
                                        title="View document"
                                      >
                                        <Eye className="w-5 h-5" />
                                      </button>
                                      <a
                                        href={doc.downloadURL}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition flex-shrink-0"
                                        title="Download document"
                                      >
                                        <Download className="w-5 h-5" />
                                      </a>
                                    </>
                                  )}
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}

                    {/* Empty Folder */}
                    {isExpanded && documentCount === 0 && (
                      <div className="border-t-2 border-gray-200 bg-gray-50 p-8 text-center">
                        <p className="text-gray-500 font-medium mb-3">
                          No files in this folder yet
                        </p>
                        <button
                          onClick={() => {
                            setSelectedDocumentCategory(category);
                            setShowDocumentUploadModal(true);
                          }}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-semibold text-sm"
                        >
                          <Upload className="w-4 h-4" />
                          Upload First File
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-12 text-center">
            <p className="text-lg text-gray-700">
              No document categories available yet.
            </p>
          </div>
        )}

        {/* Total Statistics */}
        {documentCategories.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl border-2 border-blue-300 p-6">
              <p className="text-sm font-bold text-blue-700 uppercase mb-2">
                📊 Total Files
              </p>
              <p className="text-4xl font-bold text-blue-900">
                {memberDocuments.length}
              </p>
              <p className="text-sm text-blue-700 mt-2">
                Across {documentCategories.length} categories
              </p>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl border-2 border-purple-300 p-6">
              <p className="text-sm font-bold text-purple-700 uppercase mb-2">
                📂 Categories
              </p>
              <p className="text-4xl font-bold text-purple-900">
                {documentCategories.length}
              </p>
              <p className="text-sm text-purple-700 mt-2">
                Ready to organize your files
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Document Upload Modal */}
      {showDocumentUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full">
            {/* Header */}
            <div className="px-8 py-6 border-b-2 bg-gradient-to-r from-purple-600 to-blue-600 rounded-t-3xl">
              <div className="flex items-center justify-between text-white">
                <div>
                  <h2 className="text-2xl font-bold">📤 Upload Files</h2>
                  <p className="text-purple-100 mt-1">
                    {selectedDocumentCategory
                      ? `Add files to "${selectedDocumentCategory.name}" (${
                          documentsByCategory[selectedDocumentCategory.id]
                            ?.documents.length || 0
                        }/5)`
                      : "Select a folder first"}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowDocumentUploadModal(false);
                    setSelectedDocumentCategory(null);
                    setDocumentUploadFiles([]);
                  }}
                  className="p-2 hover:bg-white/20 rounded-lg transition"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-8 space-y-6">
              {!selectedDocumentCategory ? (
                <div className="space-y-3">
                  <p className="text-sm font-bold text-gray-600 uppercase">
                    📂 Select a Folder
                  </p>
                  <div className="grid grid-cols-1 gap-3">
                    {documentCategories.map((category) => (
                      <button
                        key={category.id}
                        onClick={() => setSelectedDocumentCategory(category)}
                        className="p-4 border-2 border-gray-300 rounded-xl hover:border-purple-500 hover:bg-purple-50 transition text-left group"
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-2xl">📁</span>
                          <h4 className="font-bold text-gray-900 capitalize group-hover:text-purple-600 transition">
                            {category.name}
                          </h4>
                        </div>
                        {category.note && (
                          <p className="text-sm text-gray-600 ml-8">
                            {category.note}
                          </p>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  {/* Category Selected */}
                  <div className="p-5 bg-gradient-to-r from-purple-50 to-blue-50 rounded-2xl border-2 border-purple-200">
                    <p className="text-sm font-bold text-purple-700 uppercase mb-2">
                      📂 Uploading to Folder
                    </p>
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">📁</span>
                      <div>
                        <p className="text-lg font-bold text-gray-900 capitalize">
                          {selectedDocumentCategory.name}
                        </p>
                        {selectedDocumentCategory.note && (
                          <p className="text-sm text-gray-600 mt-1">
                            {selectedDocumentCategory.note}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* File Upload */}
                  <div>
                    <label className="text-sm font-bold text-gray-700 block mb-3 uppercase">
                      📄 Choose Files (Multiple Allowed)
                    </label>
                    <p className="text-xs text-gray-600 mb-3">
                      📌 You can select up to{" "}
                      {Math.max(
                        1,
                        5 -
                          (documentsByCategory[selectedDocumentCategory.id]
                            ?.documents.length || 0)
                      )}{" "}
                      more file(s) for this folder
                    </p>
                    <div className="relative border-3 border-dashed border-purple-400 rounded-2xl p-8 text-center hover:border-purple-600 hover:bg-purple-50 transition cursor-pointer group bg-purple-50/30">
                      <input
                        type="file"
                        multiple
                        onChange={(e) => {
                          const filesArray = Array.from(e.target.files || []);
                          const currentCount =
                            documentsByCategory[selectedDocumentCategory.id]
                              ?.documents.length || 0;
                          const availableSlots = 5 - currentCount;

                          if (filesArray.length > availableSlots) {
                            alert(
                              `You can only add ${availableSlots} more file(s) to this folder. Maximum 5 per category.`
                            );
                            const limitedFiles = filesArray.slice(
                              0,
                              availableSlots
                            );
                            setDocumentUploadFiles(limitedFiles);
                          } else {
                            setDocumentUploadFiles(filesArray);
                          }
                        }}
                        disabled={
                          documentsByCategory[selectedDocumentCategory.id]
                            ?.documents.length >= 5
                        }
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <div className="group-hover:text-purple-600 transition">
                        <Upload className="w-12 h-12 mx-auto mb-3 text-purple-500 group-hover:text-purple-700" />
                        <p className="text-base font-bold text-gray-800 mb-1">
                          Click to upload or drag and drop
                        </p>
                        <p className="text-sm text-gray-600">
                          PNG, JPG, PDF, DOCX - Up to 10MB each
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Selected Files List */}
                  {documentUploadFiles.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-bold text-gray-700 uppercase">
                        ✓ Selected Files ({documentUploadFiles.length})
                      </p>
                      <div className="space-y-2 bg-green-50 rounded-2xl border-2 border-green-300 p-4 max-h-48 overflow-y-auto">
                        {documentUploadFiles.map((file, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-3 bg-white rounded-lg border-2 border-green-200"
                          >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <div className="p-2 bg-green-100 rounded-lg flex-shrink-0">
                                {getFileIcon(file.type)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-gray-900 truncate text-sm">
                                  {file.name}
                                </p>
                                <p className="text-xs text-gray-600 mt-1">
                                  {formatFileSize(file.size)}
                                </p>
                              </div>
                            </div>
                            <button
                              onClick={() => {
                                setDocumentUploadFiles(
                                  documentUploadFiles.filter(
                                    (_, i) => i !== index
                                  )
                                );
                              }}
                              className="p-2 hover:bg-red-100 rounded-lg transition text-red-600 flex-shrink-0 ml-2"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Footer */}
            <div className="px-8 py-6 border-t-2 border-gray-200 bg-gray-50 flex gap-3 rounded-b-3xl">
              <button
                onClick={() => {
                  setShowDocumentUploadModal(false);
                  setSelectedDocumentCategory(null);
                  setDocumentUploadFiles([]);
                }}
                className="flex-1 px-6 py-3 bg-gray-200 text-gray-800 rounded-xl hover:bg-gray-300 transition font-bold text-base"
                disabled={documentUploadLoading}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (
                    !selectedDocumentCategory ||
                    documentUploadFiles.length === 0
                  ) {
                    alert(
                      "Please select a category and choose at least one file"
                    );
                    return;
                  }
                  // Call parent handler with files
                  handleDocumentUpload(documentUploadFiles);
                  setDocumentUploadFiles([]);
                }}
                disabled={
                  !selectedDocumentCategory ||
                  documentUploadFiles.length === 0 ||
                  documentUploadLoading
                }
                className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:from-purple-700 hover:to-blue-700 disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed transition font-bold flex items-center justify-center gap-2 text-base"
              >
                {documentUploadLoading ? (
                  <>
                    <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                    Uploading {documentUploadFiles.length} file(s)...
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5" />
                    Upload {documentUploadFiles.length} File(s)
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentsSection;
