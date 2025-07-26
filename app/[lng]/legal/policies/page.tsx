import { getDictionary } from "@/lib/i18n/get-dictionary";
import { Locale } from "@/lib/i18n/config";
import { Navbar } from "@/components/navbar";

export default async function PrivacyPolicyPage({ params: { lng } }: { params: { lng: Locale } }) {
  const dict = await getDictionary(lng);

  return (
    <div className="min-h-screen bg-background">
      <Navbar lng={lng} dict={dict} />
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-4">{dict.legal.policy.title}</h1>
        <p className="mb-4">{dict.legal.policy.lastUpdated}</p>

        <h2 className="text-2xl font-bold mb-2">{dict.legal.policy.introductionTitle}</h2>
        <p className="mb-4">{dict.legal.policy.introductionContent}</p>

        <h2 className="text-2xl font-bold mb-2">{dict.legal.policy.informationWeCollectTitle}</h2>
        <p className="mb-4">{dict.legal.policy.informationWeCollectContent}</p>
        <ul className="list-disc list-inside mb-4">
          <li>{dict.legal.policy.informationWeCollectListItem1}</li>
          <li>{dict.legal.policy.informationWeCollectListItem2}</li>
          <li>{dict.legal.policy.informationWeCollectListItem3}</li>
        </ul>

        <h2 className="text-2xl font-bold mb-2">{dict.legal.policy.howWeUseYourInformationTitle}</h2>
        <p className="mb-4">{dict.legal.policy.howWeUseYourInformationContent}</p>
        <ul className="list-disc list-inside mb-4">
          <li>{dict.legal.policy.howWeUseYourInformationListItem1}</li>
          <li>{dict.legal.policy.howWeUseYourInformationListItem2}</li>
          <li>{dict.legal.policy.howWeUseYourInformationListItem3}</li>
          <li>{dict.legal.policy.howWeUseYourInformationListItem4}</li>
          <li>{dict.legal.policy.howWeUseYourInformationListItem5}</li>
        </ul>

        <h2 className="text-2xl font-bold mb-2">{dict.legal.policy.disclosureOfYourInformationTitle}</h2>
        <p className="mb-4">{dict.legal.policy.disclosureOfYourInformationContent}</p>
        <ul className="list-disc list-inside mb-4">
          <li>{dict.legal.policy.disclosureOfYourInformationListItem1}</li>
          <li>{dict.legal.policy.disclosureOfYourInformationListItem2}</li>
          <li>{dict.legal.policy.disclosureOfYourInformationListItem3}</li>
          <li>{dict.legal.policy.disclosureOfYourInformationListItem4}</li>
        </ul>

        <h2 className="text-2xl font-bold mb-2">{dict.legal.policy.dataSecurityTitle}</h2>
        <p className="mb-4">{dict.legal.policy.dataSecurityContent}</p>

        <h2 className="text-2xl font-bold mb-2">{dict.legal.policy.changesToPolicyTitle}</h2>
        <p className="mb-4">{dict.legal.policy.changesToPolicyContent}</p>

        <h2 className="text-2xl font-bold mb-2">{dict.legal.policy.contactTitle}</h2>
        <p className="mb-4">{dict.legal.policy.contactContent}</p>
      </main>
    </div>
  );
}
