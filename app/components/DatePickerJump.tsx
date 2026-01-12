'use client';

export default function DatePickerJump() {
  return (
    <input
      type="date"
      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
      onChange={(e) => {
        if (e.target.value) {
          window.location.href = `/browse?date=${e.target.value}`;
        }
      }}
    />
  );
}
