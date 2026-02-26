'use client';

import React from 'react';
import { useAuth } from '@/context/auth-context';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { User, LogOut, ShoppingBag, Settings, Truck } from 'lucide-react';
import Link from 'next/link';

export function UserMenu() {
  const { user, logout } = useAuth();

  if (!user) return null;

  const initials = user.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-auto gap-2 rounded-full border px-4 hover:bg-muted">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
            {initials}
          </div>
          <span className="hidden text-sm font-medium md:inline-block">Hi, {user.name.split(' ')[0]}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user.name}</p>
            <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/profile" className="flex w-full cursor-pointer items-center">
            <User className="mr-2 h-4 w-4" />
            <span>Profile</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/my-orders" className="flex w-full cursor-pointer items-center">
            <ShoppingBag className="mr-2 h-4 w-4" />
            <span>My Orders</span>
          </Link>
        </DropdownMenuItem>
        {user.role === 'delivery_agent' && (
          <DropdownMenuItem asChild>
            <Link href="/delivery-agent/orders" className="flex w-full cursor-pointer items-center text-orange-600 focus:text-orange-600">
              <Truck className="mr-2 h-4 w-4" />
              <span>Delivery Panel</span>
            </Link>
          </DropdownMenuItem>
        )}
        {user.role === 'vendor' && (
          <DropdownMenuItem asChild>
            <Link href="/vendor/dashboard" className="flex w-full cursor-pointer items-center">
              <Settings className="mr-2 h-4 w-4" />
              <span>Vendor Panel</span>
            </Link>
          </DropdownMenuItem>
        )}
        {user.role === 'admin' && (
          <DropdownMenuItem asChild>
            <Link href="/admin" className="flex w-full cursor-pointer items-center">
              <Settings className="mr-2 h-4 w-4" />
              <span>Admin Dashboard</span>
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={logout} className="cursor-pointer text-red-600 focus:text-red-600">
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
