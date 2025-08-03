import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Mail, 
  MessageSquare, 
  Users, 
  Phone, 
  Send,
  CheckCircle,
  ExternalLink,
  Clock,
  Globe,
  Heart
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ContactForm {
  name: string;
  email: string;
  subject: string;
  audience: string;
  message: string;
}

const contactChannels = [
  {
    title: "Email Support",
    description: "Get detailed help from our education experts",
    contact: "hirendra.vikram@aiborg.ai",
    icon: Mail,
    action: "Send Email",
    response: "24 hours",
    color: "from-blue-500 to-blue-600"
  },
  {
    title: "Discord Community", 
    description: "Join real-time discussions with learners worldwide",
    contact: "Join Discord Server",
    icon: MessageSquare,
    action: "Join Now",
    response: "Instant",
    color: "from-indigo-500 to-purple-600"
  },
  {
    title: "Skool Community",
    description: "Structured learning communities and peer support",
    contact: "Join Skool Platform",
    icon: Users,
    action: "Access Platform", 
    response: "Instant",
    color: "from-green-500 to-emerald-600"
  },
  {
    title: "WhatsApp Support",
    description: "Direct messaging for quick questions and support",
    contact: "+44 7404568207",
    icon: Phone,
    action: "Chat Now",
    response: "Few hours",
    color: "from-green-600 to-green-700"
  }
];

export function ContactSection() {
  const [formData, setFormData] = useState<ContactForm>({
    name: "",
    email: "",
    subject: "",
    audience: "",
    message: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { toast } = useToast();

  const handleInputChange = (field: keyof ContactForm, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate form submission
    setTimeout(() => {
      setIsSubmitted(true);
      setIsSubmitting(false);
      toast({
        title: "Message sent successfully!",
        description: "We'll get back to you within 24 hours.",
      });
      
      // Reset form after delay
      setTimeout(() => {
        setIsSubmitted(false);
        setFormData({
          name: "",
          email: "",
          subject: "",
          audience: "",
          message: ""
        });
      }, 3000);
    }, 1500);
  };

  const isFormValid = formData.name && formData.email && formData.message && formData.audience;

  return (
    <section className="py-20 bg-gradient-to-b from-background to-muted/30">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="font-display text-4xl md:text-5xl font-bold mb-6">
            <span className="gradient-text">Get in Touch</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Have questions about our AI education programs? Need personalized guidance? 
            We're here to help you start your AI learning journey.
          </p>
        </div>

        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            
            {/* Contact Channels */}
            <div>
              <h3 className="font-display text-2xl font-bold mb-8">Choose Your Preferred Channel</h3>
              <div className="space-y-6">
                {contactChannels.map((channel, index) => {
                  const Icon = channel.icon;
                  return (
                    <Card key={index} className="p-6 hover:shadow-primary transition-all duration-300 group cursor-pointer">
                      <div className="flex items-start gap-4">
                        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-r ${channel.color} p-3 flex items-center justify-center group-hover:scale-110 transition-transform`}>
                          <Icon className="h-8 w-8 text-white" />
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-semibold text-lg">{channel.title}</h4>
                            <Badge variant="outline" className="text-xs">
                              <Clock className="h-3 w-3 mr-1" />
                              {channel.response}
                            </Badge>
                          </div>
                          
                          <p className="text-muted-foreground text-sm mb-3 leading-relaxed">
                            {channel.description}
                          </p>
                          
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-primary">
                              {channel.contact}
                            </span>
                            <Button size="sm" variant="outline" className="group-hover:bg-primary group-hover:text-primary-foreground">
                              {channel.action}
                              <ExternalLink className="h-3 w-3 ml-2" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>

            {/* Contact Form */}
            <div>
              <Card className="p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-gradient-secondary p-3">
                    <Send className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-display text-xl font-bold">Send us a Message</h3>
                    <p className="text-sm text-muted-foreground">We'll respond within 24 hours</p>
                  </div>
                </div>

                {isSubmitted ? (
                  <div className="text-center py-12">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="h-10 w-10 text-green-600" />
                    </div>
                    <h4 className="font-semibold text-lg mb-2">Message Sent Successfully!</h4>
                    <p className="text-muted-foreground">
                      Thank you for reaching out. We'll get back to you within 24 hours.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium mb-2 block">Full Name *</label>
                        <Input
                          value={formData.name}
                          onChange={(e) => handleInputChange("name", e.target.value)}
                          placeholder="Your full name"
                          required
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-2 block">Email Address *</label>
                        <Input
                          type="email"
                          value={formData.email}
                          onChange={(e) => handleInputChange("email", e.target.value)}
                          placeholder="your.email@example.com"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">Target Audience *</label>
                      <Select value={formData.audience} onValueChange={(value) => handleInputChange("audience", value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select your target audience" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="primary">Primary School (Ages 6-11)</SelectItem>
                          <SelectItem value="secondary">Secondary School (Ages 12-18)</SelectItem>
                          <SelectItem value="professional">Professional Development</SelectItem>
                          <SelectItem value="business">Business/Enterprise</SelectItem>
                          <SelectItem value="general">General Inquiry</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">Subject</label>
                      <Input
                        value={formData.subject}
                        onChange={(e) => handleInputChange("subject", e.target.value)}
                        placeholder="Brief subject of your inquiry"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">Message *</label>
                      <Textarea
                        value={formData.message}
                        onChange={(e) => handleInputChange("message", e.target.value)}
                        placeholder="Tell us about your AI learning goals, questions, or how we can help..."
                        rows={5}
                        required
                      />
                    </div>

                    <Button
                      type="submit"
                      className="w-full btn-hero"
                      disabled={!isFormValid || isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                          Sending Message...
                        </>
                      ) : (
                        <>
                          Send Message
                          <Send className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>

                    <p className="text-xs text-muted-foreground text-center">
                      By sending this message, you agree to our terms of service and privacy policy.
                    </p>
                  </form>
                )}
              </Card>

              {/* Personal Touch */}
              <div className="mt-6 text-center">
                <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                  <Heart className="h-4 w-4 text-red-500" />
                  <span>Made with care by the Aiborg™ team</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Every message is personally reviewed by our education experts
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}