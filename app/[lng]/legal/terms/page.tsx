import { getDictionary } from "@/lib/i18n/get-dictionary";
import { Locale } from "@/lib/i18n/config";
import { Navbar } from "@/components/navbar";

export default async function TermsOfServicePage({ params: { lng } }: { params: { lng: Locale } }) {
  const dict = await getDictionary(lng);

  return (
    <div className="min-h-screen bg-background">
      <Navbar lng={lng} dict={dict} />
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-4">{dict.legal.terms.title}</h1>
        <p className="mb-4">{dict.legal.terms.lastUpdated}</p>

        <h2 className="text-2xl font-bold mb-2">{dict.legal.terms.introductionTitle}</h2>
        <p className="mb-4">{dict.legal.terms.introductionContent}</p>

        <h2 className="text-2xl font-bold mb-2">{dict.legal.terms.useOfServicesTitle}</h2>
        <p className="mb-4">{dict.legal.terms.useOfServicesContent}</p>
        <ul className="list-disc list-inside mb-4">
          <li>{dict.legal.terms.useOfServicesListItem1}</li>
          <li>{dict.legal.terms.useOfServicesListItem2}</li>
          <li>{dict.legal.terms.useOfServicesListItem3}</li>
        </ul>

        <h2 className="text-2xl font-bold mb-2">{dict.legal.terms.intellectualPropertyTitle}</h2>
        <p className="mb-4">{dict.legal.terms.intellectualPropertyContent}</p>

        <h2 className="text-2xl font-bold mb-2">{dict.legal.terms.disclaimerOfWarrantiesTitle}</h2>
        <p className="mb-4">{dict.legal.terms.disclaimerOfWarrantiesContent}</p>

        <h2 className="text-2xl font-bold mb-2">{dict.legal.terms.limitationOnLiabilityTitle}</h2>
        <p className="mb-4">{dict.legal.terms.limitationOnLiabilityContent}</p>

        <h2 className="text-2xl font-bold mb-2">{dict.legal.terms.governingLawTitle}</h2>
        <p className="mb-4">{dict.legal.terms.governingLawContent}</p>

        <h2 className="text-2xl font-bold mb-2">{dict.legal.terms.changesToTermsTitle}</h2>
        <p className="mb-4">{dict.legal.terms.changesToTermsContent}</p>

        <h2 className="text-2xl font-bold mb-2">{dict.legal.terms.contactTitle}</h2>
        <p className="mb-4">{dict.legal.terms.contactContent}</p>
      </main>
    </div>
  );
}