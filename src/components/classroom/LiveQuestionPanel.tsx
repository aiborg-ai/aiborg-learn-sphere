import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageCircle, Send, ThumbsUp, CheckCircle2, Pin, Clock, Loader2 } from 'lucide-react';
import { useClassroomQuestions } from '@/hooks/useClassroomQuestions';
import { formatDistanceToNow } from 'date-fns';

interface LiveQuestionPanelProps {
  sessionId: string | null;
  compact?: boolean;
}

/**
 * Live Q&A panel for classroom
 *
 * Features:
 * - Ask questions in real-time
 * - See all questions from classmates
 * - Upvote important questions
 * - See instructor answers instantly
 * - Pinned questions highlighted
 */
export function LiveQuestionPanel({ sessionId, compact = false }: LiveQuestionPanelProps) {
  const [newQuestion, setNewQuestion] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { questions, loading, isInstructor, askQuestion, upvoteQuestion, unresolvedCount } =
    useClassroomQuestions({
      sessionId,
      autoSubscribe: true,
    });

  const handleAskQuestion = async () => {
    if (!newQuestion.trim()) return;

    setIsSubmitting(true);
    try {
      await askQuestion(newQuestion.trim());
      setNewQuestion('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpvote = async (questionId: string) => {
    await upvoteQuestion(questionId);
  };

  if (!sessionId) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          <MessageCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>No active classroom session</p>
        </CardContent>
      </Card>
    );
  }

  if (compact) {
    return (
      <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-purple-600" />
              <span className="font-semibold text-purple-900 dark:text-purple-100">Q&A</span>
            </div>
            {unresolvedCount > 0 && (
              <Badge variant="secondary" className="bg-orange-500 text-white">
                {unresolvedCount} pending
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Live Q&A
          </CardTitle>
          <div className="flex items-center gap-2">
            {unresolvedCount > 0 && (
              <Badge variant="secondary" className="bg-orange-500 text-white">
                {unresolvedCount} pending
              </Badge>
            )}
            {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col gap-4 min-h-0">
        {/* Ask Question Form */}
        {!isInstructor && (
          <div className="space-y-2">
            <Textarea
              placeholder="Ask a question..."
              value={newQuestion}
              onChange={e => setNewQuestion(e.target.value)}
              className="min-h-[80px] resize-none"
              disabled={isSubmitting}
              onKeyDown={e => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                  handleAskQuestion();
                }
              }}
            />
            <div className="flex justify-between items-center">
              <p className="text-xs text-muted-foreground">Cmd/Ctrl + Enter to submit</p>
              <Button
                onClick={handleAskQuestion}
                disabled={!newQuestion.trim() || isSubmitting}
                size="sm"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Ask Question
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Questions List */}
        <ScrollArea className="flex-1 -mx-4 px-4">
          <div className="space-y-3">
            {questions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <MessageCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No questions yet</p>
                <p className="text-sm">Be the first to ask!</p>
              </div>
            ) : (
              questions.map(question => {
                const profile = question.user_profile;
                const displayName = profile?.display_name || profile?.email || 'Student';
                const initials = displayName
                  .split(' ')
                  .map(n => n[0])
                  .join('')
                  .toUpperCase()
                  .substring(0, 2);

                return (
                  <Card
                    key={question.id}
                    className={`${
                      question.is_pinned
                        ? 'border-yellow-400 dark:border-yellow-600 bg-yellow-50 dark:bg-yellow-950/20'
                        : ''
                    } ${question.is_resolved ? 'opacity-75' : ''}`}
                  >
                    <CardContent className="p-4">
                      {/* Header */}
                      <div className="flex items-start gap-3 mb-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={profile?.avatar_url || undefined} />
                          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white text-xs">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-sm">{displayName}</span>
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatDistanceToNow(new Date(question.created_at), {
                                addSuffix: true,
                              })}
                            </span>
                            {question.is_pinned && (
                              <Badge variant="secondary" className="bg-yellow-500 text-white">
                                <Pin className="h-3 w-3 mr-1" />
                                Pinned
                              </Badge>
                            )}
                            {question.is_resolved && (
                              <Badge variant="secondary" className="bg-green-500 text-white">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Resolved
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm mt-1">{question.question_text}</p>
                          {question.question_context && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Context: {question.question_context}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Answer */}
                      {question.answer_text && (
                        <div className="ml-11 mt-3 p-3 bg-green-50 dark:bg-green-950/20 border-l-4 border-green-500 rounded">
                          <div className="flex items-center gap-2 mb-1">
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                            <span className="text-xs font-semibold text-green-700 dark:text-green-400">
                              Instructor Answer
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(question.answered_at!), {
                                addSuffix: true,
                              })}
                            </span>
                          </div>
                          <p className="text-sm">{question.answer_text}</p>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex items-center gap-2 mt-3 ml-11">
                        <Button
                          variant="ghost"
                          size="sm"
                          className={`h-8 ${
                            question.user_has_upvoted
                              ? 'text-blue-600 bg-blue-50 dark:bg-blue-950/20'
                              : ''
                          }`}
                          onClick={() => handleUpvote(question.id)}
                        >
                          <ThumbsUp className="h-3 w-3 mr-1" />
                          {question.upvotes}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
