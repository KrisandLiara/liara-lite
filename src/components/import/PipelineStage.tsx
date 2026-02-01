import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

interface PipelineStageProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  children: React.ReactNode;
}

export const PipelineStage: React.FC<PipelineStageProps> = ({ icon, title, description, children }) => {
  return (
    <Card className="flex flex-col">
      <CardHeader>
        <div className="flex items-center gap-4">
          {icon}
          <div className="flex flex-col">
            <CardTitle>{title}</CardTitle>
            <CardDescription className="mt-1">{description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col justify-center">
        {children}
      </CardContent>
    </Card>
  );
}; 