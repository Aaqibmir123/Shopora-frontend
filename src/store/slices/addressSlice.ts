import { createSlice } from '@reduxjs/toolkit';

type Address = {
  id: string;
  label: string;
  name: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
};

type AddressState = {
  items: Address[];
  selectedId: string;
};

const initialState: AddressState = {
  items: [],
  selectedId: ''
};

const normalizeDefault = (items: Address[], selectedId: string) =>
  items.map((item) => ({ ...item, isDefault: item.id === selectedId }));

const addressSlice = createSlice({
  name: 'address',
  initialState,
  reducers: {
    selectAddress(state: AddressState, action: any) {
      state.selectedId = action.payload;
      state.items = normalizeDefault(state.items, state.selectedId);
    },
    saveAddress(state: AddressState, action: any) {
      const payload = action.payload as Partial<Address> & { id?: string };
      const id = payload.id ?? `addr-${Date.now()}`;
      const nextItem: Address = {
        id,
        label: payload.label ?? 'Home',
        name: payload.name ?? '',
        phone: payload.phone ?? '',
        line1: payload.line1 ?? '',
        line2: payload.line2,
        city: payload.city ?? '',
        state: payload.state ?? '',
        postalCode: payload.postalCode ?? '',
        country: payload.country ?? 'India',
        isDefault: payload.isDefault ?? state.selectedId === id
      };

      const filtered = state.items.filter((item) => item.id !== id);
      const updated = [...filtered, nextItem];
      const selectedId = nextItem.isDefault ? id : state.selectedId;
      state.items = normalizeDefault(updated, selectedId);
      state.selectedId = selectedId;
    },
    deleteAddress(state: AddressState, action: any) {
      const id = String(action.payload);
      const remaining = state.items.filter((item) => item.id !== id);
      const nextSelected = remaining.find((item) => item.isDefault)?.id ?? remaining[0]?.id ?? '';
      state.items = normalizeDefault(remaining, nextSelected);
      state.selectedId = nextSelected;
    }
  }
});

export const { selectAddress, saveAddress, deleteAddress } = addressSlice.actions;
export const addressReducer = addressSlice.reducer;
export type { Address };

export const selectAddressItems = (state: { address: AddressState }) => state.address.items;
export const selectSelectedAddress = (state: { address: AddressState }) =>
  state.address.items.find((item) => item.id === state.address.selectedId) ?? state.address.items[0] ?? null;
