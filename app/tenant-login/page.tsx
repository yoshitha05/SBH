import Link from "next/link";

export default function TenantLoginPage() {
  return (
    <div className="min-h-screen p-6 flex items-center justify-center bg-slate-50">
      <div className="w-full max-w-3xl grid md:grid-cols-2 gap-6">
        <div className="border rounded-2xl p-6 bg-white shadow-sm">
          <p className="text-sm uppercase tracking-[0.3em] text-gray-500">Tenant Login</p>
          <h1 className="text-3xl font-bold mt-2">Existing tenant access</h1>
          <p className="text-gray-600 mt-3">
            Approved tenants can log in here anytime. Once the owner disables access after move-out, the tenant should no longer be able to enter this flow.
          </p>
          <div className="mt-6 space-y-3">
            <input className="w-full border rounded-lg p-3" placeholder="Tenant ID or email" />
            <input className="w-full border rounded-lg p-3" placeholder="Password / OTP" />
            <button className="w-full bg-sky-600 text-white rounded-lg py-3">Login</button>
          </div>
        </div>

        <div className="border rounded-2xl p-6 bg-white shadow-sm">
          <p className="text-sm uppercase tracking-[0.3em] text-gray-500">New Tenant</p>
          <h2 className="text-2xl font-bold mt-2">Submit Google Form</h2>
          <p className="text-gray-600 mt-3">
            Add your Google Form URL to the button below. The submitted tenant details should then be reviewed in the owner tenant tab and approved before login is enabled.
          </p>
          <Link
            href="https://forms.gle/your-google-form-link"
            target="_blank"
            className="inline-flex mt-6 px-4 py-2 rounded-lg border border-slate-300"
          >
            Open Google Form
          </Link>
          <div className="mt-6 border rounded-xl p-4 bg-slate-50 text-sm text-gray-600">
            Replace the URL in this page with your actual Google Form link.
          </div>
        </div>
      </div>
    </div>
  );
}