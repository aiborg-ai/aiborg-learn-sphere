/**
 * FlashcardHelp Component
 * In-app help and tutorial for flashcard system
 */

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { HelpCircle, Brain, Keyboard, Target, Flame, Trophy } from 'lucide-react';

export function FlashcardHelp() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <HelpCircle className="h-4 w-4 mr-2" />
          How to Use
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Flashcard Learning Guide
          </DialogTitle>
          <DialogDescription>
            Learn how to use spaced repetition for better retention
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="quality">Review</TabsTrigger>
            <TabsTrigger value="shortcuts">Shortcuts</TabsTrigger>
            <TabsTrigger value="tips">Tips</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div>
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <Brain className="h-4 w-4 text-primary" />
                    What is Spaced Repetition?
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    A learning technique that shows you information at increasing intervals
                    just before you forget it. This leads to 25% better retention with less
                    study time.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">How It Works</h3>
                  <ul className="text-sm space-y-2 text-muted-foreground list-disc list-inside">
                    <li>New cards reviewed after 1 day</li>
                    <li>Correct answers → longer intervals (6 days, then exponential)</li>
                    <li>Difficult cards shown more frequently</li>
                    <li>Easy cards appear less often</li>
                    <li>Algorithm adapts to your performance</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Getting Started</h3>
                  <ol className="text-sm space-y-2 text-muted-foreground list-decimal list-inside">
                    <li>Create a deck for your topic (e.g., "Spanish Verbs")</li>
                    <li>Add 20-30 flashcards to start</li>
                    <li>Click "Start Review" when cards are due</li>
                    <li>Review daily to build your streak 🔥</li>
                  </ol>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Review Quality Tab */}
          <TabsContent value="quality" className="space-y-4">
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div>
                  <h3 className="font-semibold mb-3">When to Use Each Button</h3>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-950/20 rounded-lg">
                      <Badge variant="destructive" className="mt-1">Again</Badge>
                      <div className="flex-1">
                        <p className="font-medium text-sm mb-1">Completely Forgot</p>
                        <p className="text-xs text-muted-foreground">
                          Use when you had no idea. Card will show again in ~10 minutes.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
                      <Badge variant="outline" className="mt-1 border-orange-500">Hard</Badge>
                      <div className="flex-1">
                        <p className="font-medium text-sm mb-1">Difficult to Recall</p>
                        <p className="text-xs text-muted-foreground">
                          Took significant effort. Next review in 1-3 days.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                      <Badge variant="default" className="mt-1">Good</Badge>
                      <div className="flex-1">
                        <p className="font-medium text-sm mb-1">Correct Answer</p>
                        <p className="text-xs text-muted-foreground">
                          Your default choice. Normal interval increase (3-7 days).
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                      <Badge variant="secondary" className="mt-1">Easy</Badge>
                      <div className="flex-1">
                        <p className="font-medium text-sm mb-1">Perfect Recall</p>
                        <p className="text-xs text-muted-foreground">
                          Instant answer. Longer interval (7-14 days).
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-muted p-3 rounded-lg">
                  <p className="text-sm font-medium mb-1">💡 Pro Tip</p>
                  <p className="text-xs text-muted-foreground">
                    Use "Good" for about 70% of your reviews. Be honest with yourself -
                    rating everything as "Easy" will hurt your long-term retention!
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Keyboard Shortcuts Tab */}
          <TabsContent value="shortcuts" className="space-y-4">
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Keyboard className="h-4 w-4 text-primary" />
                    Keyboard Shortcuts for Power Users
                  </h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-2 bg-muted rounded">
                      <span className="text-sm">Flip card</span>
                      <div className="flex gap-2">
                        <kbd className="px-2 py-1 bg-background border rounded text-xs">Space</kbd>
                        <span className="text-xs text-muted-foreground">or</span>
                        <kbd className="px-2 py-1 bg-background border rounded text-xs">Enter</kbd>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-2 bg-muted rounded">
                      <span className="text-sm text-red-600 dark:text-red-400">Again</span>
                      <kbd className="px-2 py-1 bg-background border rounded text-xs">1</kbd>
                    </div>

                    <div className="flex items-center justify-between p-2 bg-muted rounded">
                      <span className="text-sm text-orange-600 dark:text-orange-400">Hard</span>
                      <kbd className="px-2 py-1 bg-background border rounded text-xs">2</kbd>
                    </div>

                    <div className="flex items-center justify-between p-2 bg-muted rounded">
                      <span className="text-sm text-green-600 dark:text-green-400">Good</span>
                      <kbd className="px-2 py-1 bg-background border rounded text-xs">3</kbd>
                    </div>

                    <div className="flex items-center justify-between p-2 bg-muted rounded">
                      <span className="text-sm text-blue-600 dark:text-blue-400">Easy</span>
                      <kbd className="px-2 py-1 bg-background border rounded text-xs">4</kbd>
                    </div>
                  </div>
                </div>

                <div className="bg-primary/10 p-3 rounded-lg">
                  <p className="text-sm font-medium mb-2">⚡ Speed Workflow</p>
                  <ol className="text-xs space-y-1 text-muted-foreground list-decimal list-inside">
                    <li>Read question</li>
                    <li>Think of answer</li>
                    <li>Press Space to flip</li>
                    <li>Press 1-4 for quality</li>
                    <li>Repeat! Aim for 10-15 cards/minute</li>
                  </ol>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tips Tab */}
          <TabsContent value="tips" className="space-y-4">
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Target className="h-4 w-4 text-primary" />
                    Best Practices
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium mb-1 flex items-center gap-2">
                        <Flame className="h-4 w-4 text-orange-500" />
                        Daily Review Habit
                      </p>
                      <ul className="text-xs text-muted-foreground list-disc list-inside ml-6 space-y-1">
                        <li>Review at the same time every day</li>
                        <li>15-30 minutes is optimal</li>
                        <li>Morning reviews = better retention</li>
                        <li>Build and maintain your streak!</li>
                      </ul>
                    </div>

                    <div>
                      <p className="text-sm font-medium mb-1">📝 Creating Good Flashcards</p>
                      <ul className="text-xs text-muted-foreground list-disc list-inside ml-6 space-y-1">
                        <li>One concept per card</li>
                        <li>Keep questions & answers short</li>
                        <li>Be specific with context</li>
                        <li>Use simple, clear language</li>
                      </ul>
                    </div>

                    <div>
                      <p className="text-sm font-medium mb-1 flex items-center gap-2">
                        <Trophy className="h-4 w-4 text-yellow-500" />
                        Progress Goals
                      </p>
                      <ul className="text-xs text-muted-foreground list-disc list-inside ml-6 space-y-1">
                        <li>Start with 20-30 new cards/day</li>
                        <li>Aim for 7-day streak first</li>
                        <li>Review all due cards daily</li>
                        <li>Gradually increase deck size</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-2 text-sm">❌ Common Mistakes</h3>
                  <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                    <li>Creating too many cards at once</li>
                    <li>Rating everything as "Easy"</li>
                    <li>Making cards too complex</li>
                    <li>Skipping review days</li>
                    <li>Not using keyboard shortcuts</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-between items-center pt-4 border-t">
          <p className="text-xs text-muted-foreground">
            Using SM-2 algorithm (same as Anki)
          </p>
          <Button variant="outline" size="sm" asChild>
            <a href="/FLASHCARD_USER_GUIDE.md" target="_blank">
              Full Guide
            </a>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
