/**
 * Model Performance Component
 *
 * Displays ML model accuracy and performance metrics
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Brain, Target, TrendingUp } from 'lucide-react';

export function ModelPerformance() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-green-500" />
            Overall Accuracy
          </CardTitle>
          <CardDescription>Model prediction accuracy</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-green-600">N/A</div>
          <p className="text-sm text-gray-500 mt-2">
            Accuracy will be calculated after generating predictions
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-blue-500" />
            Predictions Generated
          </CardTitle>
          <CardDescription>Total predictions made</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">0</div>
          <p className="text-sm text-gray-500 mt-2">Last 30 days</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-purple-500" />
            Success Rate
          </CardTitle>
          <CardDescription>Intervention effectiveness</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">N/A</div>
          <p className="text-sm text-gray-500 mt-2">
            Success rate tracked after interventions complete
          </p>
        </CardContent>
      </Card>

      <Card className="md:col-span-3">
        <CardHeader>
          <CardTitle>Model Information</CardTitle>
          <CardDescription>Current model configuration</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-500">Model Version</div>
              <div className="font-semibold">1.0</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Algorithm</div>
              <div className="font-semibold">Rule-based with weighted features</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Features Used</div>
              <div className="font-semibold">23 engineered features</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Last Updated</div>
              <div className="font-semibold">January 2026</div>
            </div>
          </div>
          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
            <p className="text-sm text-blue-900 dark:text-blue-100">
              <strong>Note:</strong> This is a rule-based prediction system. Future versions will
              include TensorFlow.js models for improved accuracy.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
