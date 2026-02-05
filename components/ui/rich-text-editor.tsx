'use client';

import { useState, useRef, useEffect } from 'react';
import { 
  Bold, 
  Italic, 
  Strikethrough, 
  List, 
  Image, 
  Video, 
  Link2,
  Heading,
  Upload,
  X,
  Loader2
} from 'lucide-react';
import { Button } from './button';
import { createClient } from '@/lib/supabase/client';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: boolean;
}

export function RichTextEditor({ 
  value, 
  onChange, 
  placeholder = 'เขียนรายละเอียด...',
  error 
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [videoUrl, setVideoUrl] = useState('');
  const [uploading, setUploading] = useState(false);

  // Initialize content
  useEffect(() => {
    if (editorRef.current && value && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
    }
  }, []);

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    handleInput();
  };

  const handleBold = () => execCommand('bold');
  const handleItalic = () => execCommand('italic');
  const handleStrikethrough = () => execCommand('strikeThrough');
  const handleList = () => execCommand('insertUnorderedList');
  
  const handleHeading = () => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    
    // Check if current selection is already in a heading
    const parentElement = selection.anchorNode?.parentElement;
    const isInHeading = parentElement?.tagName === 'H3' || 
                        parentElement?.closest('h3') !== null;
    
    if (isInHeading) {
      // Toggle off - convert back to paragraph
      execCommand('formatBlock', '<p>');
    } else {
      // Toggle on - convert to heading
      execCommand('formatBlock', '<h3>');
    }
  };

  const handleInsertLink = () => {
    if (linkUrl) {
      execCommand('createLink', linkUrl);
      setLinkUrl('');
      setShowLinkModal(false);
    }
  };

  // Upload image to Supabase Storage
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('กรุณาเลือกไฟล์รูปภาพเท่านั้น');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('ไฟล์รูปภาพต้องมีขนาดไม่เกิน 5MB');
      return;
    }

    setUploading(true);

    try {
      const supabase = createClient();
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `description-images/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('products')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('products')
        .getPublicUrl(filePath);

      execCommand('insertImage', publicUrl);
    } catch (err) {
      console.error('Upload error:', err);
      alert('เกิดข้อผิดพลาดในการอัปโหลด');
    } finally {
      setUploading(false);
      if (imageInputRef.current) {
        imageInputRef.current.value = '';
      }
    }
  };

  // Upload video to Supabase Storage
  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('video/')) {
      alert('กรุณาเลือกไฟล์วิดีโอเท่านั้น');
      return;
    }

    // Validate file size (max 50MB - Supabase Storage limit)
    if (file.size > 50 * 1024 * 1024) {
      alert('ไฟล์วิดีโอต้องมีขนาดไม่เกิน 50MB\n\nสำหรับวิดีโอที่ใหญ่กว่านี้ แนะนำให้อัปโหลดไปยัง YouTube หรือ Loom แล้ววาง URL แทน');
      return;
    }

    setUploading(true);

    try {
      const supabase = createClient();
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `description-videos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('products')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('products')
        .getPublicUrl(filePath);

      const videoHtml = `<div class="video-embed"><video src="${publicUrl}" controls style="width:100%;border-radius:1rem;"></video></div>`;
      execCommand('insertHTML', videoHtml);
      setShowVideoModal(false);
    } catch (err: any) {
      console.error('Video upload error:', err);
      // Show more specific error message
      let errorMessage = 'เกิดข้อผิดพลาดในการอัปโหลด';
      if (err?.message) {
        if (err.message.includes('Payload too large') || err.message.includes('413') || err.message.includes('exceeded')) {
          errorMessage = 'ไฟล์ใหญ่เกินไป - Supabase Storage มี limit ที่ 50MB\n\nแนะนำ: อัปโหลดวิดีโอไปยัง YouTube หรือ Loom แล้ววาง URL แทน';
        } else if (err.message.includes('bucket') || err.message.includes('Bucket')) {
          errorMessage = 'Storage bucket ยังไม่ได้ตั้งค่า กรุณาสร้าง bucket "products"';
        } else {
          errorMessage = `อัปโหลดไม่สำเร็จ: ${err.message}`;
        }
      }
      alert(errorMessage);
    } finally {
      setUploading(false);
      if (videoInputRef.current) {
        videoInputRef.current.value = '';
      }
    }
  };

  const handleInsertVideoUrl = () => {
    if (videoUrl) {
      // Extract video ID from YouTube URL
      let embedUrl = videoUrl;
      const youtubeMatch = videoUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/);
      if (youtubeMatch) {
        embedUrl = `https://www.youtube.com/embed/${youtubeMatch[1]}`;
      }
      
      // Check for Loom
      const loomMatch = videoUrl.match(/loom\.com\/share\/([a-zA-Z0-9]+)/);
      if (loomMatch) {
        embedUrl = `https://www.loom.com/embed/${loomMatch[1]}`;
      }
      
      const iframe = `<div class="video-embed"><iframe src="${embedUrl}" frameborder="0" allowfullscreen style="width:100%;aspect-ratio:16/9;border-radius:1rem;"></iframe></div>`;
      execCommand('insertHTML', iframe);
      setVideoUrl('');
      setShowVideoModal(false);
    }
  };

  // Handle click on media elements to show delete button
  const handleEditorClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    
    // Check if clicked on delete button
    if (target.classList.contains('media-delete-btn') || target.closest('.media-delete-btn')) {
      e.preventDefault();
      e.stopPropagation();
      const mediaWrapper = target.closest('.media-wrapper');
      if (mediaWrapper) {
        mediaWrapper.remove();
        handleInput();
      }
      return;
    }

    // Remove existing wrappers first
    const existingWrappers = editorRef.current?.querySelectorAll('.media-wrapper');
    existingWrappers?.forEach(wrapper => {
      const media = wrapper.querySelector('img, video, .video-embed');
      if (media) {
        wrapper.replaceWith(media);
      }
    });

    // Check if clicked on image or video
    if (target.tagName === 'IMG') {
      wrapMediaWithDeleteButton(target);
    } else if (target.tagName === 'VIDEO' || target.closest('.video-embed')) {
      const videoElement = target.tagName === 'VIDEO' ? target : target.closest('.video-embed');
      if (videoElement) {
        wrapMediaWithDeleteButton(videoElement as HTMLElement);
      }
    }
  };

  const wrapMediaWithDeleteButton = (element: HTMLElement) => {
    // Create wrapper
    const wrapper = document.createElement('div');
    wrapper.className = 'media-wrapper';
    wrapper.style.cssText = 'position:relative;display:inline-block;width:100%;';
    
    // Create delete button
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'media-delete-btn';
    deleteBtn.innerHTML = '×';
    deleteBtn.type = 'button';
    deleteBtn.style.cssText = `
      position: absolute;
      top: 8px;
      right: 8px;
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: rgba(0,0,0,0.7);
      color: white;
      border: none;
      cursor: pointer;
      font-size: 18px;
      line-height: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10;
      transition: background 0.2s;
    `;
    
    // Wrap the element
    element.parentNode?.insertBefore(wrapper, element);
    wrapper.appendChild(element);
    wrapper.appendChild(deleteBtn);
  };

  return (
    <div className={`border border-input rounded-lg overflow-hidden transition-all hover:ring-2 hover:ring-ring hover:ring-offset-2 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 ${error ? 'border-destructive focus-within:ring-destructive' : ''}`}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-2">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={handleHeading}
          title="หัวข้อ"
        >
          <Heading className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={handleBold}
          title="ตัวหนา"
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={handleStrikethrough}
          title="ขีดฆ่า"
        >
          <Strikethrough className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={handleItalic}
          title="ตัวเอียง"
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={handleList}
          title="รายการ"
        >
          <List className="h-4 w-4" />
        </Button>
        
        <div className="w-px h-6 bg-border mx-1" />

        {/* Image Upload Button */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => imageInputRef.current?.click()}
          title="แทรกรูปภาพ"
          disabled={uploading}
        >
          {uploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Image className="h-4 w-4" />
          )}
        </Button>
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageUpload}
        />

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => setShowVideoModal(true)}
          title="แทรกวิดีโอ"
        >
          <Video className="h-4 w-4" />
        </Button>
        <input
          ref={videoInputRef}
          type="file"
          accept="video/*"
          className="hidden"
          onChange={handleVideoUpload}
        />

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => setShowLinkModal(true)}
          title="แทรกลิงก์"
        >
          <Link2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        className="rich-text-editor min-h-[150px] p-3 focus:outline-none max-w-none"
        onInput={handleInput}
        onClick={handleEditorClick}
        data-placeholder={placeholder}
        style={{
          minHeight: '150px',
        }}
      />

      {/* Link Modal */}
      {showLinkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-background p-4 rounded-lg shadow-lg w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium">แทรกลิงก์</h4>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => {
                  setShowLinkModal(false);
                  setLinkUrl('');
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <input
              type="url"
              placeholder="https://example.com"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              className="w-full p-2 border rounded-lg mb-3"
              autoFocus
            />
            <div className="flex gap-2 justify-end">
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                onClick={() => {
                  setShowLinkModal(false);
                  setLinkUrl('');
                }}
              >
                ยกเลิก
              </Button>
              <Button type="button" size="sm" onClick={handleInsertLink}>
                แทรก
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Video Modal */}
      {showVideoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-background p-5 rounded-lg shadow-lg w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium">แทรกวิดีโอ</h4>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => {
                  setShowVideoModal(false);
                  setVideoUrl('');
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Video URL Input */}
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <Link2 className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">วาง URL วิดีโอ</span>
              </div>
              <input
                type="url"
                placeholder="YouTube, Loom URL..."
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                className="w-full p-2 border rounded-lg mb-2"
              />
              <Button 
                type="button" 
                className="w-full" 
                onClick={handleInsertVideoUrl}
                disabled={!videoUrl || uploading}
              >
                Embed Video
              </Button>
            </div>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">หรือ</span>
              </div>
            </div>

            {/* Upload Video */}
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => videoInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  กำลังอัปโหลด...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  อัปโหลดจากเครื่อง
                </>
              )}
            </Button>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              รองรับ MP4, WebM (สูงสุด 50MB)
            </p>
          </div>
        </div>
      )}

      <style jsx global>{`
        .rich-text-editor:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          pointer-events: none;
        }
        .rich-text-editor {
          border: none !important;
          outline: none !important;
          box-shadow: none !important;
        }
        .rich-text-editor h3 {
          font-size: 1.1rem;
          font-weight: 600;
          margin: 0.5rem 0;
        }
        .rich-text-editor ul {
          list-style-type: disc;
          padding-left: 1.5rem;
          margin: 0.5rem 0;
        }
        .rich-text-editor a {
          color: #3b82f6;
          text-decoration: underline;
        }
        .rich-text-editor img {
          max-width: 100%;
          height: auto;
          border-radius: 1rem;
          margin: 1rem 0;
          cursor: pointer;
        }
        .rich-text-editor video {
          max-width: 100%;
          border-radius: 1rem;
          margin: 1rem 0;
          cursor: pointer;
        }
        .video-embed {
          margin: 1rem 0;
          cursor: pointer;
          border-radius: 1rem;
          overflow: hidden;
        }
        .video-embed iframe {
          border-radius: 1rem;
        }
        .media-wrapper {
          position: relative;
          display: inline-block;
          width: 100%;
        }
        .media-wrapper .media-delete-btn:hover {
          background: rgba(220, 38, 38, 0.9) !important;
        }
        .media-wrapper img,
        .media-wrapper video,
        .media-wrapper .video-embed {
          outline: 2px solid #3b82f6;
          outline-offset: 2px;
        }
      `}</style>
    </div>
  );
}
