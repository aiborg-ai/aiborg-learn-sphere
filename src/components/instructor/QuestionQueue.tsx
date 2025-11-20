import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  MessageCircle,
  Send,
  ThumbsUp,
  CheckCircle2,
  Pin,
  Clock,
  AlertCircle,
  X,
} from '@/components/ui/icons';
import { useClassroomQuestions } from '@/hooks/useClassroomQuestions';
import { formatDistanceToNow } from 'date-fns';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

interface QuestionQueueProps {
  sessionId: string | null;
}

/**
 * Instructor-only question queue with answer interface
 *
 * Features:
 * - Prioritized question queue
 * - Quick answer interface
 * - Pin important questions
 * - Mark as resolved
 * - Sort by upvotes/time/pinned
 */
export function QuestionQueue({ sessionId }: QuestionQueueProps) {
  const [answeringQuestionId, setAnsweringQuestionId] = useState<string | null>(null);
  const [answerText, setAnswerText] = useState('');

  const {
    questions,
    isInstructor,
    answerQuestion,
    pinQuestion,
    resolveQuestion,
    unresolvedCount,
    pinnedQuestions,
  } = useClassroomQuestions({
    sessionId,
    autoSubscribe: true,
  });

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

  if (!isInstructor) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          <AlertCircle className="h-12 w-12 mx-auto mb-2 text-orange-500" />
          <p>Instructor access only</p>
        </CardContent>
      </Card>
    );
  }

  const handleAnswerSubmit = async (questionId: string) => {
    if (!answerText.trim()) return;

    const success = await answerQuestion(questionId, answerText);
    if (success) {
      setAnswerText('');
      setAnsweringQuestionId(null);
    }
  };

  const handlePinToggle = async (questionId: string, currentlyPinned: boolean) => {
    await pinQuestion(questionId, !currentlyPinned);
  };

  const handleResolveToggle = async (questionId: string, currentlyResolved: boolean) => {
    await resolveQuestion(questionId, !currentlyResolved);
  };

  const unresolvedQuestions = questions.filter(q => !q.is_resolved);
  const resolvedQuestions = questions.filter(q => q.is_resolved);

  const QuestionCard = ({ question }: { question: (typeof questions)[0] }) => {
    const profile = question.user_profile;
    const displayName = profile?.display_name || profile?.email || 'Student';
    const initials = displayName
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);

    const isAnswering = answeringQuestionId === question.id;

    return (
      <Card
        className={`${
          question.is_pinned ? 'border-yellow-400 bg-yellow-50 dark:bg-yellow-950/20' : ''
        }`}
      >
        <CardContent className="p-4">
          {/* Header */}
          <div className="flex items-start gap-3 mb-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={profile?.avatar_url || undefined} />
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white text-sm">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="font-semibold">{displayName}</span>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatDistanceToNow(new Date(question.created_at), { addSuffix: true })}
                </span>
                {question.is_pinned && (
                  <Badge variant="secondary" className="bg-yellow-500 text-white">
                    <Pin className="h-3 w-3 mr-1" />
                    Pinned
                  </Badge>
                )}
              </div>
              <p className="text-sm font-medium mb-2">{question.question_text}</p>
              {question.question_context && (
                <p className="text-xs text-muted-foreground mb-2">
                  Context: {question.question_context}
                </p>
              )}

              {/* Upvotes indicator */}
              <div className="flex items-center gap-3 text-sm">
                <div className="flex items-center gap-1 text-blue-600">
                  <ThumbsUp className="h-4 w-4" />
                  <span className="font-medium">{question.upvotes}</span>
                  <span className="text-muted-foreground">upvotes</span>
                </div>
                <div className="text-muted-foreground text-xs">Priority: {question.priority}</div>
              </div>
            </div>
          </div>

          {/* Existing Answer */}
          {question.answer_text && (
            <div className="mb-3 p-3 bg-green-50 dark:bg-green-950/20 border-l-4 border-green-500 rounded">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span className="text-xs font-semibold text-green-700">Your Answer</span>
              </div>
              <p className="text-sm">{question.answer_text}</p>
            </div>
          )}

          {/* Answer Form */}
          {isAnswering && !question.answer_text && (
            <div className="space-y-2 mb-3">
              <Textarea
                placeholder="Type your answer..."
                value={answerText}
                onChange={e => setAnswerText(e.target.value)}
                className="min-h-[100px]"
                aria-label="Type your answer to student question"
              />
              <div className="flex gap-2">
                <Button
                  onClick={() => handleAnswerSubmit(question.id)}
                  disabled={!answerText.trim()}
                  size="sm"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Send Answer
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setAnsweringQuestionId(null);
                    setAnswerText('');
                  }}
                  size="sm"
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 flex-wrap">
            {!question.answer_text && !isAnswering && (
              <Button
                variant="default"
                size="sm"
                onClick={() => setAnsweringQuestionId(question.id)}
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                Answer
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePinToggle(question.id, question.is_pinned)}
            >
              <Pin className="h-4 w-4 mr-2" />
              {question.is_pinned ? 'Unpin' : 'Pin'}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => handleResolveToggle(question.id, question.is_resolved)}
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              {question.is_resolved ? 'Unresolve' : 'Mark Resolved'}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Question Queue
          </CardTitle>
          <div className="flex items-center gap-2">
            {unresolvedCount > 0 && (
              <Badge variant="secondary" className="bg-orange-500 text-white">
                {unresolvedCount} pending
              </Badge>
            )}
            {pinnedQuestions.length > 0 && (
              <Badge variant="secondary" className="bg-yellow-500 text-white">
                <Pin className="h-3 w-3 mr-1" />
                {pinnedQuestions.length}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 min-h-0">
        <ScrollArea className="h-full -mx-4 px-4">
          {questions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MessageCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No questions yet</p>
              <p className="text-sm">Questions will appear here in real-time</p>
            </div>
          ) : (
            <Accordion type="single" collapsible defaultValue="unresolved">
              {/* Unresolved Questions */}
              <AccordionItem value="unresolved">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-orange-500" />
                    <span className="font-semibold">Pending Questions ({unresolvedCount})</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-3 pt-2">
                    {unresolvedQuestions.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        All questions answered! 🎉
                      </p>
                    ) : (
                      unresolvedQuestions.map(question => (
                        <QuestionCard key={question.id} question={question} />
                      ))
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Resolved Questions */}
              {resolvedQuestions.length > 0 && (
                <AccordionItem value="resolved">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <span className="font-semibold">Resolved ({resolvedQuestions.length})</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3 pt-2">
                      {resolvedQuestions.map(question => (
                        <QuestionCard key={question.id} question={question} />
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )}
            </Accordion>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
