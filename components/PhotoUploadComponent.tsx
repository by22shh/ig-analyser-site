import React, { useState, useCallback } from 'react';
import { Upload, Image as ImageIcon, Search, AlertCircle, CheckCircle, ExternalLink } from 'lucide-react';
import { searchByImage, extractInstagramUsernames } from '../services/yandexImageService';
import { InstagramMatch } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

interface PhotoUploadComponentProps {
    onUsernameSelect: (username: string) => void;
}

export const PhotoUploadComponent: React.FC<PhotoUploadComponentProps> = ({ onUsernameSelect }) => {
    const { t } = useLanguage();
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isSearching, setIsSearching] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [matches, setMatches] = useState<InstagramMatch[]>([]);
    const [isDragging, setIsDragging] = useState(false);

    const handleFileSelect = useCallback((file: File) => {
        setError(null);
        setMatches([]);

        // Validate file type
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        if (!validTypes.includes(file.type)) {
            setError(t('photo_error_format'));
            return;
        }

        // Validate file size (max 10MB)
        const maxSize = 10 * 1024 * 1024;
        if (file.size > maxSize) {
            setError(t('photo_error_size'));
            return;
        }

        setSelectedFile(file);

        // Create preview
        const reader = new FileReader();
        reader.onloadend = () => {
            setPreviewUrl(reader.result as string);
        };
        reader.readAsDataURL(file);
    }, [t]);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        const file = e.dataTransfer.files[0];
        if (file) {
            handleFileSelect(file);
        }
    }, [handleFileSelect]);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const handleSearch = async () => {
        if (!selectedFile) return;

        setIsSearching(true);
        setError(null);
        setMatches([]);

        try {
            const results = await searchByImage(selectedFile);

            if (!results.images || results.images.length === 0) {
                setError(t('photo_error_no_results'));
                return;
            }

            const instagramMatches = extractInstagramUsernames(results.images);

            if (instagramMatches.length === 0) {
                setError(t('photo_error_no_results'));
                return;
            }

            setMatches(instagramMatches);
        } catch (err: any) {
            console.error('Search error:', err);
            setError(err.message || t('error_system'));
        } finally {
            setIsSearching(false);
        }
    };

    // Cleanup preview URL on unmount to prevent memory leaks
    React.useEffect(() => {
        return () => {
            if (previewUrl) {
                URL.revokeObjectURL(previewUrl);
            }
        };
    }, [previewUrl]);

    return (
        <div className="space-y-6">
            {/* Upload Area */}
            <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={`relative border-2 border-dashed rounded-xl p-8 transition-all ${isDragging
                    ? 'border-cyan-400 bg-cyan-500/10'
                    : 'border-slate-700 hover:border-cyan-500/50 bg-slate-900/30'
                    }`}
            >
                <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileSelect(file);
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />

                <div className="flex flex-col items-center gap-4 pointer-events-none">
                    {previewUrl ? (
                        <div className="relative">
                            <img
                                src={previewUrl}
                                alt="Preview"
                                className="max-w-full max-h-64 rounded-lg border border-cyan-500/30 shadow-lg"
                            />
                            <div className="absolute top-2 right-2 bg-green-500/90 text-white px-2 py-1 rounded text-xs font-bold flex items-center gap-1">
                                <CheckCircle className="w-3 h-3" />
                                {t('photo_uploaded')}
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="w-16 h-16 bg-cyan-500/10 rounded-full flex items-center justify-center">
                                <Upload className="w-8 h-8 text-cyan-400" />
                            </div>
                            <div className="text-center">
                                <p className="text-white font-bold mb-1">{t('photo_drag_drop')}</p>
                                <p className="text-xs text-slate-400">{t('photo_formats')}</p>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="p-4 bg-red-950/50 border border-red-500/50 rounded-lg text-red-200 text-sm flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                    <span>{error}</span>
                </div>
            )}

            {/* Search Button */}
            {selectedFile && !matches.length && (
                <button
                    onClick={handleSearch}
                    disabled={isSearching}
                    className="w-full bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white font-bold py-4 rounded-lg transition-all flex items-center justify-center gap-3 uppercase tracking-wider shadow-[0_0_20px_rgba(34,211,238,0.3)] hover:shadow-[0_0_30px_rgba(34,211,238,0.5)] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isSearching ? (
                        <>
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            {t('photo_searching')}
                        </>
                    ) : (
                        <>
                            <Search className="w-5 h-5" />
                            {t('photo_search_btn')}
                        </>
                    )}
                </button>
            )}

            {/* Results */}
            {matches.length > 0 && (
                <div className="space-y-4">
                    <div className="flex items-center gap-2 text-sm font-bold text-cyan-400 uppercase tracking-wider">
                        <ImageIcon className="w-4 h-4" />
                        {t('photo_results_title')} ({matches.length})
                    </div>

                    <p className="text-xs text-slate-400">{t('photo_select_username')}</p>

                    <div className="space-y-2">
                        {matches.map((match, index) => (
                            <div
                                key={index}
                                role="button"
                                tabIndex={0}
                                onClick={() => onUsernameSelect(match.username)}
                                onKeyDown={(event) => {
                                    if (event.key === 'Enter' || event.key === ' ') {
                                        event.preventDefault();
                                        onUsernameSelect(match.username);
                                    }
                                }}
                                className="w-full bg-slate-800/50 hover:bg-cyan-900/30 border border-slate-700 hover:border-cyan-500/50 rounded-lg p-4 transition-all text-left group cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/60"
                            >
                                <div className="flex items-center justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="text-white font-bold group-hover:text-cyan-400 transition-colors truncate">
                                            @{match.username}
                                        </div>
                                        <div className="text-xs text-slate-400 mt-1">
                                            {t('photo_confidence')}: {match.confidence}% • {t(`photo_source_${match.source}`)}
                                        </div>
                                        <div className="mt-2">
                                            <a
                                                href={match.profileUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                onClick={(e) => e.stopPropagation()}
                                                className="inline-flex items-center gap-1 text-[11px] text-cyan-400 hover:text-white transition-colors"
                                            >
                                                <ExternalLink className="w-3 h-3" />
                                                <span className="truncate max-w-[220px]">
                                                    {t('photo_open_instagram')}
                                                </span>
                                            </a>
                                        </div>
                                    </div>
                                    <div className="text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                        <Search className="w-5 h-5" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
