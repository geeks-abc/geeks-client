import { useLocalSearchParams } from 'expo-router';
import React from 'react';
import { ListingFormScreen } from '@/components/listing-form-screen';

export default function EditListing() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <ListingFormScreen mode="edit" listingId={Number(id)} />;
}
