/**
 * FamilyMembersStep (Step 3)
 * Allows adding/removing family members (optional step)
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight, ArrowLeft, Plus, X } from '@/components/ui/icons';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { familyMemberSchema, type FamilyMemberInput } from '../types';

interface FamilyMembersStepProps {
  initialMembers: FamilyMemberInput[];
  maxMembers: number;
  onNext: (members: FamilyMemberInput[]) => void;
  onBack: () => void;
}

export function FamilyMembersStep({
  initialMembers,
  maxMembers,
  onNext,
  onBack,
}: FamilyMembersStepProps) {
  const [members, setMembers] = useState<FamilyMemberInput[]>(initialMembers);
  const [showAddForm, setShowAddForm] = useState(false);

  const form = useForm<FamilyMemberInput>({
    resolver: zodResolver(familyMemberSchema),
    defaultValues: {
      member_name: '',
      member_email: '',
      member_age: 10,
      relationship: 'child',
    },
  });

  const addMember = (data: FamilyMemberInput) => {
    setMembers([...members, data]);
    form.reset();
    setShowAddForm(false);
  };

  const removeMember = (index: number) => {
    setMembers(members.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Add Family Members</h2>
        <p className="text-gray-600">
          Add up to {maxMembers} family members (optional - you can add them later too)
        </p>
      </div>

      {/* Current Members */}
      {members.length > 0 && (
        <div className="space-y-3">
          {members.map((member, i) => (
            <Card key={i} className="p-4 flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">{member.member_name}</p>
                <p className="text-sm text-gray-600">
                  {member.member_email} • Age {member.member_age} • {member.relationship}
                </p>
              </div>
              <Button type="button" variant="ghost" size="sm" onClick={() => removeMember(i)}>
                <X className="w-4 h-4" />
              </Button>
            </Card>
          ))}
        </div>
      )}

      {/* Add Member Form */}
      {showAddForm ? (
        <Card className="p-4 border-2 border-amber-200">
          <form onSubmit={form.handleSubmit(addMember)} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="member_name">Name *</Label>
                <Input
                  id="member_name"
                  {...form.register('member_name')}
                  placeholder="Family member name"
                />
              </div>

              <div>
                <Label htmlFor="member_email">Email</Label>
                <Input
                  id="member_email"
                  type="email"
                  {...form.register('member_email')}
                  placeholder="email@example.com"
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="member_age">Age *</Label>
                <Input
                  id="member_age"
                  type="number"
                  {...form.register('member_age', { valueAsNumber: true })}
                  min={5}
                  max={120}
                />
              </div>

              <div>
                <Label htmlFor="relationship">Relationship *</Label>
                <Select
                  value={form.watch('relationship')}
                  onValueChange={value => form.setValue('relationship', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="spouse">Spouse</SelectItem>
                    <SelectItem value="child">Child</SelectItem>
                    <SelectItem value="parent">Parent</SelectItem>
                    <SelectItem value="sibling">Sibling</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  form.reset();
                  setShowAddForm(false);
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button type="submit" className="flex-1">
                Add Member
              </Button>
            </div>
          </form>
        </Card>
      ) : (
        members.length < maxMembers && (
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowAddForm(true)}
            className="w-full border-2 border-dashed border-gray-300 hover:border-amber-500"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Family Member
          </Button>
        )
      )}

      {/* Navigation */}
      <div className="flex gap-3">
        <Button type="button" variant="outline" onClick={onBack} className="flex-1">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button
          type="button"
          onClick={() => onNext(members)}
          className="flex-1 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
        >
          {members.length > 0 ? `Continue with ${members.length} members` : 'Skip for Now'}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>

      <p className="text-xs text-center text-gray-500">
        You can add or remove family members anytime from your dashboard
      </p>
    </div>
  );
}
