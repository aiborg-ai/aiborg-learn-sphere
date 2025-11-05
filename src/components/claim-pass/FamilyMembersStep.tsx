import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Users, Plus, Trash2, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { FamilyMemberInput } from '@/types';

const familyMemberSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  relationship: z.string().min(1, 'Please select a relationship'),
});

type FamilyMemberFormData = z.infer<typeof familyMemberSchema>;

interface FamilyMembersStepProps {
  initialData: FamilyMemberInput[];
  onNext: (members: FamilyMemberInput[]) => void;
  onBack: () => void;
}

export const FamilyMembersStep = ({ initialData, onNext, onBack }: FamilyMembersStepProps) => {
  const [familyMembers, setFamilyMembers] = useState<FamilyMemberInput[]>(initialData);
  const [isAddingMember, setIsAddingMember] = useState(initialData.length === 0);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<FamilyMemberFormData>({
    resolver: zodResolver(familyMemberSchema),
  });

  const relationship = watch('relationship');

  const onAddMember = (data: FamilyMemberFormData) => {
    if (familyMembers.length >= 6) {
      return; // Max 6 members
    }

    setFamilyMembers([...familyMembers, data]);
    reset();
    setIsAddingMember(false);
  };

  const onRemoveMember = (index: number) => {
    setFamilyMembers(familyMembers.filter((_, i) => i !== index));
  };

  const onContinue = () => {
    onNext(familyMembers);
  };

  const canAddMore = familyMembers.length < 6;

  const relationships = [
    { value: 'spouse', label: 'Spouse' },
    { value: 'partner', label: 'Partner' },
    { value: 'child', label: 'Child' },
    { value: 'parent', label: 'Parent' },
    { value: 'sibling', label: 'Sibling' },
    { value: 'grandparent', label: 'Grandparent' },
    { value: 'grandchild', label: 'Grandchild' },
    { value: 'other', label: 'Other Family Member' },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Info Banner */}
      <Card className="border-2 border-blue-200 bg-blue-50/50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-blue-900 mb-1">Add Family Members (Optional)</h3>
              <p className="text-sm text-blue-700 mb-2">
                You can add up to 6 family members now, or add them later from your dashboard. Each
                member will receive an invitation email to create their account.
              </p>
              <div className="bg-blue-100 rounded-lg p-3 text-sm text-blue-800">
                <strong>Note:</strong> If you prefer to add family members later, just click
                "Continue" to skip this step.
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Added Members List */}
      {familyMembers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-purple-600" />
                Added Family Members ({familyMembers.length}/6)
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {familyMembers.map((member, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border"
              >
                <div className="flex-1">
                  <div className="font-semibold">{member.name}</div>
                  <div className="text-sm text-gray-600">{member.email}</div>
                  <div className="text-xs text-gray-500 capitalize">{member.relationship}</div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemoveMember(index)}
                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Add Member Form */}
      {isAddingMember ? (
        <Card>
          <CardHeader>
            <CardTitle>Add Family Member</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onAddMember)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">
                  Full Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  {...register('name')}
                  placeholder="Jane Doe"
                  className={errors.name ? 'border-red-500' : ''}
                />
                {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">
                  Email Address <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  {...register('email')}
                  placeholder="jane.doe@example.com"
                  className={errors.email ? 'border-red-500' : ''}
                />
                {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="relationship">
                  Relationship <span className="text-red-500">*</span>
                </Label>
                <Select
                  onValueChange={value => setValue('relationship', value)}
                  value={relationship}
                >
                  <SelectTrigger className={errors.relationship ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select relationship" />
                  </SelectTrigger>
                  <SelectContent>
                    {relationships.map(rel => (
                      <SelectItem key={rel.value} value={rel.value}>
                        {rel.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.relationship && (
                  <p className="text-sm text-red-500">{errors.relationship.message}</p>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <Button type="submit" className="flex-1">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Member
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    reset();
                    setIsAddingMember(false);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        canAddMore && (
          <Button
            variant="outline"
            size="lg"
            onClick={() => setIsAddingMember(true)}
            className="w-full border-2 border-dashed border-purple-300 hover:border-purple-500 hover:bg-purple-50"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Family Member ({familyMembers.length}/6)
          </Button>
        )
      )}

      {/* Skip Notice */}
      {familyMembers.length === 0 && !isAddingMember && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
          <p className="text-sm text-gray-600">
            No family members added yet. You can add them later from your dashboard.
          </p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-between gap-4 pt-4">
        <Button type="button" variant="outline" size="lg" onClick={onBack}>
          ← Back
        </Button>
        <Button
          onClick={onContinue}
          size="lg"
          className="bg-gradient-to-r from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700"
        >
          Continue to Review →
        </Button>
      </div>
    </div>
  );
};
