import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const faqData = [
  {
    question: 'What is aiborg and how does it work?',
    answer:
      'aiborg is an AI-powered education platform that provides personalized learning experiences for all ages. Our platform uses advanced AI to adapt content to your learning style, pace, and goals, ensuring maximum effectiveness and engagement.',
  },
  {
    question: 'Who can use aiborg courses?',
    answer:
      'Our courses are designed for everyone! We offer specialized programs for young learners (ages 8-11), teenagers (12-18), professionals looking to advance their careers, and businesses wanting to upskill their teams.',
  },
  {
    question: 'How much do courses cost?',
    answer:
      'Course prices vary by audience: £25 for young learners, £39 for teenagers, £89-£199 for professionals, and £199-£499 for enterprise programs. All courses include certificates, practical projects, and ongoing support.',
  },
  {
    question: 'Do I get a certificate upon completion?',
    answer:
      'Yes! All courses include industry-recognized certificates upon completion. Professional courses also include CPE credits, and our certificates are valued by employers and educational institutions.',
  },
  {
    question: "What if I'm not satisfied with my course?",
    answer:
      "We offer a 30-day money-back guarantee on all courses. If you're not completely satisfied with your learning experience, we'll provide a full refund within 30 days of purchase.",
  },
  {
    question: 'How long do I have access to course materials?',
    answer:
      'You get lifetime access to all course materials, including updates and new content additions. You can learn at your own pace and revisit materials whenever needed.',
  },
  {
    question: 'Do you offer live sessions or is everything self-paced?',
    answer:
      'We offer both! Most courses include live interactive sessions with instructors, plus self-paced materials you can access anytime. This hybrid approach ensures flexibility while maintaining engagement.',
  },
  {
    question: 'Can businesses get custom training programs?',
    answer:
      "Absolutely! We offer custom enterprise programs tailored to your organization's specific needs, including team training, custom curricula, dedicated support, and performance analytics.",
  },
  {
    question: 'What technical requirements do I need?',
    answer:
      'You just need a modern web browser and internet connection. Our platform works on all devices - computers, tablets, and smartphones. No special software installation required.',
  },
  {
    question: 'How do I get started?',
    answer:
      'Simply select your audience type on our homepage, browse available courses, and enroll in the program that matches your goals. You can start learning immediately after enrollment.',
  },
];

export function FAQ() {
  return (
    <section
      id="faq"
      className="py-20 bg-gradient-to-br from-background via-background/95 to-background/90"
    >
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-display font-bold mb-6 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
            Frequently Asked Questions
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Find answers to common questions about our AI education platform
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <Accordion type="single" collapsible className="space-y-4">
            {faqData.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="bg-white/50 backdrop-blur-sm border border-white/20 rounded-lg px-6"
              >
                <AccordionTrigger className="text-left font-semibold text-foreground hover:text-primary transition-colors">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}
