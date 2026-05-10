
"use client"

import { useParams, useRouter } from 'next/navigation';
import { ChevronLeft, MessageSquare, Phone, Clock, FileText, User, CreditCard, Calendar, CheckCircle2, Circle, Send, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import Image from 'next/image';

const steps = [
  { id: 'placed', label: 'Order Placed', completed: true },
  { id: 'accepted', label: 'Accepted', completed: false },
  { id: 'preparing', label: 'Preparing', completed: false },
  { id: 'ready', label: 'Ready for Pickup', completed: false },
  { id: 'hero', label: 'Delivery Hero Assigned', completed: false },
  { id: 'picked', label: 'Picked Up', completed: false },
  { id: 'out', label: 'Out for Delivery', completed: false },
  { id: 'delivered', label: 'Delivered', completed: false },
];

export default function OrderDetailsPage() {
  const { orderId } = useParams();
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-10">
      {/* Header */}
      <div className="bg-white sticky top-0 z-50 px-4 py-4 flex items-center justify-between border-b border-gray-100">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-gray-50">
            <ChevronLeft className="h-6 w-6" />
          </button>
          <h1 className="text-lg font-bold">Order Details</h1>
        </div>
        <Button variant="outline" size="sm" className="rounded-full border-red-100 text-red-500 bg-red-50/50 hover:bg-red-50 font-bold px-4">
          <MessageSquare className="h-4 w-4 mr-1" />
          Chat
        </Button>
      </div>

      <div className="p-4 space-y-4 max-w-lg mx-auto">
        {/* Status Banner */}
        <div className="bg-[#FFF8E6] border border-[#FFE8B3] rounded-xl p-4 flex items-center gap-3">
          <Clock className="h-5 w-5 text-[#B38B00]" />
          <span className="text-[#B38B00] font-bold text-sm">Order placed successfully</span>
        </div>

        {/* Restaurant Info Card */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-start justify-between mb-4">
            <div className="flex gap-3">
              <div className="relative h-14 w-14 rounded-xl overflow-hidden bg-gray-100">
                <img src="https://picsum.photos/seed/restaurant/100/100" alt="Restaurant" className="object-cover" />
              </div>
              <div>
                <h2 className="font-bold text-base leading-tight">Bun Burst, ByPass Rd</h2>
                <p className="text-[10px] text-gray-400 font-medium">ByPass Rd, Near KGN Colony, Sa...</p>
              </div>
            </div>
            <button className="h-10 w-10 rounded-full bg-red-50 flex items-center justify-center text-red-500">
              <Phone className="h-4 w-4 fill-current" />
            </button>
          </div>
          
          <div className="pt-4 border-t border-gray-50">
            <div className="text-[11px] text-gray-400 font-bold uppercase tracking-wider mb-2">Order ID: <span className="text-black">#{orderId}</span></div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-3.5 w-3.5 border border-green-600 flex items-center justify-center p-0.5">
                  <div className="h-full w-full bg-green-600 rounded-full" />
                </div>
                <span className="text-sm font-bold">4 x Starter Combo</span>
              </div>
              <span className="text-sm font-black">₹796</span>
            </div>
          </div>
        </div>

        {/* Bill Summary */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="h-4 w-4 text-gray-400" />
            <h3 className="font-bold text-sm uppercase tracking-tight">Bill Summary</h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Item total</span>
              <span className="font-medium">₹796.00</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">GST (govt. taxes)</span>
              <span className="font-medium">₹40.00</span>
            </div>
            <div className="pt-3 border-t border-gray-50 flex justify-between items-center">
              <span className="text-base font-black uppercase">Paid</span>
              <span className="text-xl font-black">₹836.00</span>
            </div>
          </div>
        </div>

        {/* Customer & Payment Info */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-5">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
              <User className="h-5 w-5 text-gray-500" />
            </div>
            <div>
              <h4 className="text-sm font-bold">Devansh Gupta</h4>
              <p className="text-xs text-gray-400">+919450355709</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4 pt-4 border-t border-gray-50">
            <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
              <CreditCard className="h-5 w-5 text-gray-500" />
            </div>
            <div>
              <p className="text-[10px] text-gray-400 font-bold uppercase">Payment method</p>
              <h4 className="text-sm font-bold">Paid via: Cash on Delivery</h4>
            </div>
          </div>

          <div className="flex items-center gap-4 pt-4 border-t border-gray-50">
            <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
              <Calendar className="h-5 w-5 text-gray-500" />
            </div>
            <div>
              <p className="text-[10px] text-gray-400 font-bold uppercase">Payment date</p>
              <h4 className="text-sm font-bold">10 May 2026 at 1:26 pm</h4>
            </div>
          </div>
        </div>

        {/* Order Progress Stepper */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="font-bold text-sm mb-6">Order Progress</h3>
          <div className="space-y-0 ml-1">
            {steps.map((step, idx) => (
              <div key={step.id} className="flex gap-4 relative">
                {idx !== steps.length - 1 && (
                  <div className={cn(
                    "absolute left-[11px] top-6 w-[2px] h-full -z-0",
                    step.completed ? "bg-red-500" : "bg-gray-100"
                  )} />
                )}
                <div className="relative z-10 flex flex-col items-center">
                  {step.completed ? (
                    <div className="h-6 w-6 rounded-full bg-red-500 flex items-center justify-center shadow-md shadow-red-200">
                      <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                    </div>
                  ) : (
                    <div className="h-6 w-6 rounded-full border-2 border-gray-200 bg-white flex items-center justify-center">
                      <Circle className="h-2 w-2 text-gray-300" />
                    </div>
                  )}
                </div>
                <div className={cn(
                  "pb-6 text-sm font-bold",
                  step.completed ? "text-black" : "text-gray-400"
                )}>
                  {step.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chat Section */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-4">
            <MessageSquare className="h-4 w-4 text-red-500" />
            <h3 className="font-bold text-sm">Chat with Restaurant</h3>
          </div>
          <div className="bg-gray-50 rounded-xl p-8 mb-4 text-center">
            <p className="text-gray-400 text-xs font-medium italic">No messages yet. Say hi!</p>
          </div>
          <div className="flex gap-2">
            <Input placeholder="Type a message..." className="rounded-full bg-gray-50 border-gray-100 h-11 px-6 text-sm focus-visible:ring-red-100" />
            <Button size="icon" className="h-11 w-11 rounded-full bg-red-100 text-red-500 hover:bg-red-200">
              <Send className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Cancellation Button */}
        <button className="w-full bg-red-50 text-red-600 rounded-xl py-4 flex items-center justify-center gap-2 font-bold text-sm active:scale-95 transition-all">
          <XCircle className="h-4 w-4" />
          Request Cancellation
        </button>
      </div>
    </div>
  );
}
