'use client';

import * as React from 'react';

export function SectionHeader({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex justify-between items-start gap-4 mb-6">
      <div>
        <h2 className="text-xl font-bold text-gray-800">{title}</h2>
        {subtitle ? <p className="text-sm text-gray-600 mt-1">{subtitle}</p> : null}
      </div>
      {right ? <div className="flex items-center gap-2">{right}</div> : null}
    </div>
  );
}

export function LoadingState({ label }: { label?: string }) {
  return (
    <div className="text-gray-600">
      {label ?? 'Loading...'}
      <div className="mt-3 space-y-2">
        <div className="h-3 w-2/3 bg-gray-200 rounded animate-pulse" />
        <div className="h-3 w-1/2 bg-gray-200 rounded animate-pulse" />
        <div className="h-3 w-3/4 bg-gray-200 rounded animate-pulse" />
      </div>
    </div>
  );
}

export function EmptyState({
  title = 'Nothing here yet',
  subtitle,
  action,
}: {
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="text-center py-10">
      <div className="text-gray-800 font-semibold">{title}</div>
      {subtitle ? <div className="text-gray-600 text-sm mt-1">{subtitle}</div> : null}
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  );
}

export function ErrorBanner({
  message,
  onDismiss,
}: {
  message: string;
  onDismiss?: () => void;
}) {
  return (
    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm flex items-start justify-between gap-3">
      <div>{message}</div>
      {onDismiss ? (
        <button
          onClick={onDismiss}
          className="text-red-800/80 hover:text-red-900 font-semibold"
          aria-label="Dismiss error"
        >
          ✕
        </button>
      ) : null}
    </div>
  );
}

export function SecondaryButton({
  children,
  onClick,
  disabled,
  type = 'button',
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: 'button' | 'submit';
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50"
    >
      {children}
    </button>
  );
}

export function PrimaryButton({
  children,
  onClick,
  disabled,
  type = 'button',
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: 'button' | 'submit';
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
    >
      {children}
    </button>
  );
}
