/**
 * Courses List Page
 * Displays all available courses with filtering and search
 */

import { Navbar, Footer } from '@/components/navigation';
import { TrainingPrograms } from '@/components/TrainingPrograms';
import { LazyAIChatbot } from '@/components/features';

const CoursesListPage = () => {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main role="main">
        <TrainingPrograms />
      </main>
      <Footer />
      <LazyAIChatbot />
    </div>
  );
};

export default CoursesListPage;
