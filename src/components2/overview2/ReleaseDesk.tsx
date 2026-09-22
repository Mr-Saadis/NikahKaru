import React from 'react';

export default function ReleaseDesk() {
  return (
    <section aria-labelledby="release-desk-heading" className="bg-white rounded-[26px] p-5 border border-[#ECE5D9] shadow-[0_2px_14px_-3px_rgba(0,0,0,0.04),0_1px_4px_-1px_rgba(0,0,0,0.02)] space-y-4">
      <div className="flex items-center justify-between pb-1 border-b border-[#F5EFE6]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#064e3b] text-white flex items-center justify-center font-bold shadow-sm">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" strokeLinecap="round" strokeLinejoin="round"></path>
            </svg>
          </div>
          <div>
            <h3 className="text-[14.5px] font-bold text-[#1F1E1B]" id="release-desk-heading">Manager Release Desk</h3>
            <p className="text-[11px] text-[#867E72]">Information Disclosure Protocol</p>
          </div>
        </div>
        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-[#FEF3C7] text-[#92400E] border border-[#F6E1BA]">
          28 Pending
        </span>
      </div>

      {/* Strict Discretion Protocol Notice */}
      <div className="p-3 rounded-2xl bg-[#FAF7F2] border border-[#EBE4D8] flex items-start gap-2.5 text-[11.5px] text-[#59440e]">
        <svg className="w-4 h-4 text-[#8B6122] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" strokeLinecap="round" strokeLinejoin="round"></path>
        </svg>
        <p className="leading-relaxed">
          <strong>Strict Protocol:</strong> CNIC, exact residential address, and guardian phone numbers remain encrypted until Manager authorizes the tier referral.
        </p>
      </div>

      {/* Pending Items */}
      <div className="space-y-3">
        {/* Request 1 */}
        <div className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#EAE2D5] space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11.5px] font-bold text-[#002b17]">#REL-402</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FEE2E2] text-[#991b1b]">Urgent Sign-off</span>
          </div>
          <p className="text-[12px] text-[#24211D] leading-normal">
            Agent <strong>Hamza Rasheed</strong> requested <em>Tier-2 Contact Authorization</em> for candidate <strong>#NK-F1043</strong> on behalf of <strong>#NK-M892</strong>.
          </p>
          <div className="flex items-center justify-between pt-1 border-t border-[#EFE8DC]">
            <span className="text-[11px] text-[#7C756B]">Tier: Extended Contact</span>
            <div className="flex items-center gap-1.5">
              <button className="px-3 py-1 rounded-full bg-white border border-[#E2DBD0] hover:bg-[#F5EFE6] text-[#24211D] text-[11px] font-bold transition shadow-sm">
                Reassign
              </button>
              <button className="px-3 py-1 rounded-full bg-[#064e3b] hover:bg-[#0f4229] text-white text-[11px] font-bold shadow-sm transition">
                Approve &amp; Refer
              </button>
            </div>
          </div>
        </div>

        {/* Request 2 */}
        <div className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#EAE2D5] space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11.5px] font-bold text-[#766E61]">#REL-399</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#E6F4EA] text-[#137333]">Tier-1 Approved</span>
          </div>
          <p className="text-[12px] text-[#24211D] leading-normal">
            Agent <strong>Ayesha Khan</strong> verified candidate background for <strong>#NK-M933</strong>. Dispatched to regional liaison.
          </p>
          <div className="flex items-center justify-between pt-1 border-t border-[#EFE8DC]">
            <span className="text-[11px] text-[#7C756B]">Authorized 45m ago</span>
            <span className="text-[11px] font-bold text-[#137333] flex items-center gap-1">
              <svg className="w-3.5 h-3.5 text-[#137333]" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round"></path>
              </svg>
              Dispatched
            </span>
          </div>
        </div>
      </div>

      <button className="w-full py-2.5 rounded-full border border-[#E2DBD0] hover:bg-[#FAF7F2] text-[12px] font-bold text-[#24211D] transition text-center shadow-sm">
        View All Pending Requests (28)
      </button>
    </section>
  );
}
