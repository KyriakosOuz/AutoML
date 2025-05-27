
import React, { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, Maximize2 } from 'lucide-react';
import { filterVisualizationFiles, formatVisualizationName } from '@/utils/visualization';
import { TrainingFile } from '@/types/training';

interface MLJARExperimentResultsProps {
  files?: TrainingFile[];
}

export default function MLJARExperimentResults({ files = [] }: MLJARExperimentResultsProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Use the shared visualization filter
  const imageFiles = filterVisualizationFiles(files);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
      {imageFiles.map((file, idx) => (
        <div key={file.file_id || idx} className="relative group border rounded-lg overflow-hidden shadow-sm p-2">
          <img
            src={file.file_url}
            alt={formatVisualizationName(file.file_type)}
            className="w-full h-auto cursor-pointer transition-transform duration-300 hover:scale-105"
            onClick={() => setSelectedImage(file.file_url)}
          />
          <div className="absolute top-2 left-2 text-xs bg-black/70 text-white px-2 py-0.5 rounded">
            {formatVisualizationName(file.file_type)}
          </div>
          <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSelectedImage(file.file_url)}
              className="text-white bg-black/50 hover:bg-black"
            >
              <Maximize2 size={16} />
            </Button>
            <a
              href={file.file_url}
              download
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button
                variant="ghost"
                size="icon"
                className="text-white bg-black/50 hover:bg-black"
              >
                <Download size={16} />
              </Button>
            </a>
          </div>
        </div>
      ))}

      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-4xl">
          {selectedImage && (
            <img src={selectedImage} alt="Full-screen chart" className="w-full h-auto" />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
