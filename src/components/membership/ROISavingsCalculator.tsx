/**
 * ROI Savings Calculator Component
 *
 * Interactive calculator showing savings from Family Pass
 * Features:
 * - Slider controls for family members and courses
 * - Real-time savings calculation
 * - Visual bar chart comparison
 * - Animated numbers
 * - CTA integration
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, Users, BookOpen, ArrowRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { useCalculateSavings } from '@/hooks/useMembership';

const COURSE_PRICE = 49; // £49 per course
const FAMILY_PASS_PRICE = 20; // £20 per month

export function ROISavingsCalculator() {
  const [numMembers, setNumMembers] = useState(4);
  const [coursesPerMember, setCoursesPerMember] = useState(1);
  const [months, _setMonths] = useState(12);

  // Fetch real savings calculation from backend
  const { data: savings, isLoading: _isLoading } = useCalculateSavings(
    numMembers,
    coursesPerMember,
    months
  );

  // Animated number effect
  const [displayedSavings, setDisplayedSavings] = useState(0);

  useEffect(() => {
    if (savings?.annual_savings) {
      // Animate the number
      const target = Number(savings.annual_savings);
      const duration = 500; // ms
      const steps = 30;
      const increment = target / steps;
      let current = 0;

      const interval = setInterval(() => {
        current += increment;
        if (current >= target) {
          setDisplayedSavings(target);
          clearInterval(interval);
        } else {
          setDisplayedSavings(Math.floor(current));
        }
      }, duration / steps);

      return () => clearInterval(interval);
    }
  }, [savings]);

  const individualCost = savings?.individual_cost || 0;
  const familyPassCost = savings?.family_pass_cost || FAMILY_PASS_PRICE;
  const monthlySavings = savings?.monthly_savings || 0;
  const roiPercentage = savings?.roi_percentage || 0;

  // Calculate bar chart widths
  const maxValue = Math.max(individualCost, familyPassCost) || 100;
  const individualBarWidth = (individualCost / maxValue) * 100;
  const familyBarWidth = (familyPassCost / maxValue) * 100;

  return (
    <Card className="p-6 sm:p-8 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
          <TrendingUp className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="text-2xl font-bold text-gray-900">Savings Calculator</h3>
          <p className="text-sm text-gray-600">See your exact savings</p>
        </div>
      </div>

      {/* Input Controls */}
      <div className="space-y-6 mb-8">
        {/* Number of Family Members */}
        <div>
          <div className="flex items-center justify-between mb-3">
            {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
            <label
              id="family-members-label"
              className="flex items-center gap-2 font-semibold text-gray-900"
            >
              <Users className="w-5 h-5 text-green-600" />
              Family Members
            </label>
            <span className="text-2xl font-bold text-green-600">{numMembers}</span>
          </div>
          <Slider
            value={[numMembers]}
            onValueChange={value => setNumMembers(value[0])}
            min={1}
            max={6}
            step={1}
            className="w-full"
            aria-labelledby="family-members-label"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>1</span>
            <span>6 people</span>
          </div>
        </div>

        {/* Courses Per Member Per Month */}
        <div>
          <div className="flex items-center justify-between mb-3">
            {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
            <label
              id="courses-per-person-label"
              className="flex items-center gap-2 font-semibold text-gray-900"
            >
              <BookOpen className="w-5 h-5 text-green-600" />
              Courses per Person
            </label>
            <span className="text-2xl font-bold text-green-600">{coursesPerMember}</span>
          </div>
          <Slider
            value={[coursesPerMember]}
            onValueChange={value => setCoursesPerMember(value[0])}
            min={1}
            max={5}
            step={1}
            className="w-full"
            aria-labelledby="courses-per-person-label"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>1</span>
            <span>5 courses/month</span>
          </div>
        </div>
      </div>

      {/* Savings Display */}
      <div className="space-y-6">
        {/* Bar Chart Comparison */}
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Individual Courses</span>
              <span className="text-lg font-bold text-red-600">
                £{individualCost.toLocaleString()}/mo
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-6 overflow-hidden">
              <div
                className="bg-gradient-to-r from-red-500 to-red-600 h-6 rounded-full flex items-center justify-end px-3 transition-all duration-500"
                style={{ width: `${individualBarWidth}%` }}
              >
                {individualBarWidth > 30 && (
                  <span className="text-xs font-semibold text-white">
                    {numMembers} × {coursesPerMember} × £{COURSE_PRICE}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Family Pass</span>
              <span className="text-lg font-bold text-green-600">
                £{familyPassCost.toLocaleString()}/mo
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-6 overflow-hidden">
              <div
                className="bg-gradient-to-r from-green-500 to-emerald-600 h-6 rounded-full flex items-center justify-end px-3 transition-all duration-500"
                style={{ width: `${familyBarWidth}%` }}
              >
                <span className="text-xs font-semibold text-white">Unlimited</span>
              </div>
            </div>
          </div>
        </div>

        {/* Savings Summary Cards */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="bg-white rounded-lg p-4 border-2 border-green-200">
            <p className="text-sm font-medium text-gray-600 mb-1">Monthly Savings</p>
            <p className="text-3xl font-bold text-green-600">£{monthlySavings.toLocaleString()}</p>
          </div>

          <div className="bg-white rounded-lg p-4 border-2 border-green-200">
            <p className="text-sm font-medium text-gray-600 mb-1">Annual Savings</p>
            <p className="text-3xl font-bold text-green-600">
              £{displayedSavings.toLocaleString()}
            </p>
          </div>
        </div>

        {/* ROI Percentage */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg p-5 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90 mb-1">Return on Investment</p>
              <p className="text-4xl font-bold">{roiPercentage.toLocaleString()}%</p>
            </div>
            <TrendingUp className="w-16 h-16 opacity-30" />
          </div>
          <p className="text-sm opacity-90 mt-3">
            That's {Math.floor(roiPercentage / 100)}x more value than paying per course!
          </p>
        </div>

        {/* CTA */}
        <Button
          asChild
          size="lg"
          className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 group"
        >
          <Link to="/family-membership">
            Save £{displayedSavings.toLocaleString()}/Year - Start Now
            <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </Button>

        {/* Fine Print */}
        <p className="text-xs text-center text-gray-600">
          30-day money-back guarantee • Cancel anytime • No long-term commitment
        </p>
      </div>
    </Card>
  );
}

/**
 * Compact version for embedding in other components
 */
export function CompactROICalculator({ className }: { className?: string }) {
  const numMembers = 4;
  const coursesPerMember = 1;
  const { data: savings } = useCalculateSavings(numMembers, coursesPerMember, 12);

  if (!savings) return null;

  return (
    <div className={`flex items-baseline gap-2 ${className || ''}`}>
      <span className="text-2xl sm:text-3xl font-bold text-green-600">
        Save £{Number(savings.annual_savings).toLocaleString()}
      </span>
      <span className="text-gray-600">per year</span>
    </div>
  );
}
