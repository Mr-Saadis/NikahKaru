import Header from '@/components/layout/Header';
import AddProfileForm from '@/components/profile/AddProfileForm';
import { UserPlus } from 'lucide-react';

export default function AddProfilePage() {
  return (
    <>
      <Header
        title="Add New Profile"
        subtitle="Create a complete matrimonial profile in 9 steps"
        icon={<UserPlus className="w-5 h-5" />}
        showBackButton={false}
      />
      <AddProfileForm />
    </>
  );
}
