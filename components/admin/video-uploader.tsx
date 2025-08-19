"use client"

import React, { useState, useCallback, useEffect } from "react"
import { useDropzone } from "react-dropzone"
import { DndProvider, useDrag, useDrop } from "react-dnd"
import { HTML5Backend } from "react-dnd-html5-backend"
import { Video, X, GripVertical, Upload, CheckCircle, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { toast } from "sonner"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { v4 as uuidv4 } from "uuid"
import type { Database } from "@/lib/supabase/types"

export interface VideoFile {
  id?: string
  url: string
  caption: string
  order: number
  file?: File
  isUploading?: boolean
  progress?: number
  error?: string
}

interface DraggableVideoItemProps {
  item: VideoFile
  index: number
  moveItem: (dragIndex: number, hoverIndex: number) => void
  onRemove: (index: number) => void
  onCaptionChange: (index: number, caption: string) => void
}

const DraggableVideoItem: React.FC<DraggableVideoItemProps> = ({
  item,
  index,
  moveItem,
  onRemove,
  onCaptionChange,
}) => {
  const ref = React.useRef<HTMLDivElement>(null)
  const [, drop] = useDrop({
    accept: "video",
    hover(draggedItem: { index: number }) {
      if (draggedItem.index !== index) {
        moveItem(draggedItem.index, index)
        draggedItem.index = index
      }
    },
  })

  const [{ isDragging }, drag, preview] = useDrag({
    type: "video",
    item: { index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  })

  drag(drop(ref))

  return (
    <div
      ref={preview}
      style={{ opacity: isDragging ? 0.5 : 1 }}
      className="relative group"
    >
      <div
        ref={ref}
        className="flex items-start gap-4 p-3 border rounded-lg bg-gray-50"
      >
        <div className="cursor-move" ref={drag}>
          <GripVertical className="h-5 w-5 text-gray-400" />
        </div>
        <div className="relative w-24 h-24 rounded-md overflow-hidden bg-black">
          {item.url && !item.isUploading && !item.url.startsWith("blob:") ? (
            <video className="w-full h-full object-cover" src={item.url} controls />
          ) : item.url && item.url.startsWith("blob:") ? (
            <video className="w-full h-full object-cover" src={item.url} muted />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Video className="h-10 w-10 text-white" />
            </div>
          )}
          <Badge
            variant="secondary"
            className="absolute top-1 left-1 text-xs"
          >
            Video
          </Badge>
        </div>
        <div className="flex-1 space-y-2">
          <Input
            placeholder="Enter caption..."
            value={item.caption}
            onChange={(e) => onCaptionChange(index, e.target.value)}
            className="text-sm"
          />
          {item.isUploading && typeof item.progress === 'number' && (
            <div className="flex items-center gap-2">
              <Progress value={item.progress} className="w-full" />
              <span className="text-xs font-medium">{item.progress}%</span>
            </div>
          )}
          {item.error && (
            <div className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-4 w-4" />
              <p className="text-xs">{item.error}</p>
            </div>
          )}
          {!item.isUploading && !item.error && (
             <p className="text-xs text-gray-500 break-all" dir="ltr">URL: {item.url}</p>
          )}
        </div>
        <Button
          variant="ghost"
          type="button"
          size="icon"
          className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100"
          onClick={() => onRemove(index)}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

interface VideoUploaderProps {
  onVideosChange: (videos: VideoFile[]) => void
  maxFiles?: number
  initialVideos?: VideoFile[]
}

export const VideoUploader: React.FC<VideoUploaderProps> = ({
  onVideosChange,
  maxFiles = 5,
  initialVideos = [],
}) => {
  const [videos, setVideos] = useState<VideoFile[]>(initialVideos)
  const [videoUrl, setVideoUrl] = useState("")
  const supabase = createClientComponentClient<Database>()

  useEffect(() => {
    onVideosChange(videos)
  }, [videos, onVideosChange])

  const uploadFile = async (file: File, index: number) => {
    try {
      // Simulated progress since Storage API doesn't provide progress events
      const progressTimer = setInterval(() => {
        setVideos((current) =>
          current.map((v, i) =>
            i === index
              ? { ...v, progress: Math.min(typeof v.progress === 'number' ? v.progress + 4 : 4, 95) }
              : v
          )
        )
      }, 500)

      const fileExtension = file.name.split('.').pop()
      const fileName = `${uuidv4()}.${fileExtension}`
      const filePath = `videos/properties/${fileName}`

      const { error } = await supabase.storage
        .from("property-videos")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
          contentType: file.type,
        })

      if (error) {
        clearInterval(progressTimer)
        throw error
      }

      const { data: { publicUrl } } = supabase.storage
        .from("property-videos")
        .getPublicUrl(filePath)

      clearInterval(progressTimer)

      setVideos((currentVideos) =>
        currentVideos.map((v, i) =>
          i === index
            ? { ...v, url: publicUrl, isUploading: false, progress: 100, file: undefined }
            : v
        )
      )
    } catch (error: any) {
      console.error("Error uploading video:", error)
      let errorMessage = "Upload failed. Please try again.";
      if (error.message.includes("Failed to fetch")) {
        errorMessage = "Network error. Please check your connection and CORS settings on your Supabase bucket.";
      } else if (error.message) {
        errorMessage = error.message;
      }
      setVideos((currentVideos) =>
        currentVideos.map((v, i) =>
          i === index
            ? { ...v, isUploading: false, error: errorMessage }
            : v
        )
      )
      toast.error("Video upload failed.", { description: errorMessage })
    }
  }

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (videos.length + acceptedFiles.length > maxFiles) {
      toast.error(`Maximum ${maxFiles} videos allowed`)
      return
    }

    const validFiles = acceptedFiles.filter(file => {
      if (!file.type.startsWith('video/')) {
        toast.error(`${file.name} is not a valid video file`)
        return false
      }
      return true
    })

    if (validFiles.length === 0) return

    const newItems: VideoFile[] = validFiles.map((file, i) => ({
      url: URL.createObjectURL(file),
      caption: "",
      order: videos.length + i,
      file,
      isUploading: true,
      progress: 0,
    }))

    const updatedVideos = [...videos, ...newItems]
    setVideos(updatedVideos)

    updatedVideos.forEach((item, index) => {
      if (item.file && item.isUploading) {
        uploadFile(item.file, index)
      }
    })

    toast.success(`${validFiles.length} video(s) added and upload started.`)
  }, [videos, maxFiles, supabase])

  const addVideo = () => {
    if (!videoUrl.trim()) return
    if (videos.length >= maxFiles) {
      toast.error(`You can only upload a maximum of ${maxFiles} videos.`)
      return
    }

    const newVideo: VideoFile = {
      url: videoUrl,
      caption: "",
      order: videos.length,
    }

    setVideos((prev) => [...prev, newVideo])
    setVideoUrl("")
  }

  const removeVideo = (index: number) => {
    const video = videos[index];
    if (video && video.url && !video.url.startsWith('blob:')) {
      const filePath = new URL(video.url).pathname.split('/property-videos/')[1];
      if (filePath) {
        supabase.storage.from('property-videos').remove([filePath]);
      }
    }
    setVideos((prev) => prev.filter((_, i) => i !== index))
  }

  const updateCaption = (index: number, caption: string) => {
    setVideos((prev) =>
      prev.map((item, i) => (i === index ? { ...item, caption } : item))
    )
  }

  const moveVideo = (dragIndex: number, hoverIndex: number) => {
    const draggedItem = videos[dragIndex]
    const updatedVideos = [...videos]
    updatedVideos.splice(dragIndex, 1)
    updatedVideos.splice(hoverIndex, 0, draggedItem)

    const reorderedVideos = updatedVideos.map((item, index) => ({
      ...item,
      order: index,
    }))
    setVideos(reorderedVideos)
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'video/*': ['.mp4', '.webm', '.ogg', '.mov'] },
    multiple: true,
  })

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="space-y-6">
        {videos.length < maxFiles && (
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all duration-200 ${
              isDragActive ? 'border-blue-500 bg-blue-50 scale-[1.02]' : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
            }`}
          >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center space-y-3">
              <div className={`p-4 rounded-full ${isDragActive ? 'bg-blue-100' : 'bg-gray-100'}`}>
                <Upload className={`h-8 w-8 ${isDragActive ? 'text-blue-500' : 'text-gray-400'}`} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  {isDragActive ? 'Drop your videos here' : 'Upload Property Videos'}
                </h3>
                <p className="text-gray-600 mb-1">
                  Drag & drop video files here, or click to browse
                </p>
                <p className="text-sm text-gray-500">
                  Supports MP4, WEBM, OGG, MOV • Max {maxFiles} videos
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <label className="font-medium">Add Video from URL</label>
          <div className="flex gap-2">
            <Input
              type="url"
              inputMode="url"
              dir="ltr"
              placeholder="e.g., https://www.youtube.com/watch?v=... or public MP4 URL"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
            />
            <Button type="button" onClick={addVideo}>Add Video</Button>
          </div>
        </div>

        {videos.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Uploaded Videos</h3>
            <div className="space-y-3">
              {videos.map((item, index) => (
                <DraggableVideoItem
                  key={item.id || item.url}
                  index={index}
                  item={item}
                  moveItem={moveVideo}
                  onRemove={removeVideo}
                  onCaptionChange={updateCaption}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </DndProvider>
  )
}
