import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle, XCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Season2StatusPage() {
  const [searchParams] = useSearchParams();
  const type = searchParams.get('type');
  const name = searchParams.get('name');
  const email = searchParams.get('email');

  const getStatusContent = () => {
    switch (type) {
      case 'confirmed':
        return {
          icon: <CheckCircle className="w-20 h-20 text-green-500" />,
          title: 'Registration Confirmed!',
          message: (
            <>
              <span className="text-purple-600 font-semibold">{name}</span> has been confirmed for
              Season 2.
            </>
          ),
          subMessage: `Confirmation email sent to ${email}`,
          bgGradient: 'from-green-500 to-emerald-600',
        };
      case 'rejected':
        return {
          icon: <XCircle className="w-20 h-20 text-red-500" />,
          title: 'Registration Rejected',
          message: (
            <>
              <span className="text-purple-600 font-semibold">{name}</span>'s registration has been
              rejected.
            </>
          ),
          subMessage: `Notification sent to ${email}`,
          bgGradient: 'from-red-500 to-rose-600',
        };
      case 'already_processed':
        return {
          icon: <AlertCircle className="w-20 h-20 text-blue-500" />,
          title: 'Already Processed',
          message: 'This registration has already been processed.',
          subMessage: null,
          bgGradient: 'from-blue-500 to-indigo-600',
        };
      default:
        return {
          icon: <AlertCircle className="w-20 h-20 text-yellow-500" />,
          title: 'Error',
          message: 'An error occurred while processing the request.',
          subMessage: null,
          bgGradient: 'from-yellow-500 to-orange-600',
        };
    }
  };

  const content = getStatusContent();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className={`bg-gradient-to-r ${content.bgGradient} p-6 text-center`}>
          <h1 className="text-2xl font-bold text-white">AIBORG Season 2</h1>
        </div>

        <div className="p-8 text-center">
          <div className="flex justify-center mb-6">{content.icon}</div>

          <h2 className="text-2xl font-bold text-gray-900 mb-4">{content.title}</h2>

          <p className="text-gray-600 mb-2">{content.message}</p>

          {content.subMessage && <p className="text-sm text-gray-500 mb-6">{content.subMessage}</p>}

          <Link to="/">
            <Button className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to AIBORG
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
