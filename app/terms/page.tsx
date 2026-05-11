"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

export default function TermsPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#0c0e14] text-amber-50">
      {/* Верхняя панель */}
      <div className="sticky top-0 z-20 flex items-center justify-between border-b border-amber-900/20 bg-[#0a0e14]/95 px-3 py-3 backdrop-blur-[8px]">
        <button
          onClick={() => router.back()}
          className="tap-target flex items-center gap-2 rounded-md border-2 border-amber-700/60 bg-[#120f0c] px-3 py-1.5 font-pixel text-[11px] text-amber-100 transition hover:bg-amber-900/30 active:scale-95"
        >
          <span>←</span> Назад
        </button>

        <h1 className="font-pixel text-sm font-bold uppercase tracking-wider text-amber-200/80">
          Terms of Service
        </h1>

        <div className="w-16" /> {/* Пустой div для баланса */}
      </div>

      {/* Контент */}
      <div className="mx-auto max-w-3xl p-4 sm:p-6">
        <div className="rounded-2xl border border-amber-800/30 bg-black/40 p-4 text-sm leading-relaxed text-zinc-300 sm:p-6 sm:text-base">
          <p className="mb-4">
            Mini Apps (“MA”) on Telegram allow you to connect to third-party Service Providers (“SP”)
            in their mini app environment and access services or purchase goods directly from such
            Service Providers using Telegram apps.
          </p>

          <p className="mb-4">
            These Terms of Service for Mini Apps (“MA Terms”) govern your usage of the Telegram
            Mini App Feature (“MAF”) provided by Telegram Messenger Inc. (“Telegram”) and constitute
            a legally binding agreement between you and Telegram. For the purposes of these terms,
            ‘we’, ‘us’ and ‘our’ refers to Telegram, and ‘you’ refers to you, the user of the MAF.
          </p>

          <p className="mb-6">
            When you connect to a Mini App (“MA”), you may be further subject to its SP terms as
            agreed between you and the SP. Such terms are to be considered in addition to this document.
          </p>

          <h2 className="mb-3 text-lg font-semibold text-amber-200">1. Acceptance of MA Terms</h2>
          <p className="mb-4">
            By using the MAF, you agree that you have read in full, understood and accepted to be
            legally bound by the terms contained herein, in addition to{" "}
            <a
              href="https://telegram.org/terms"
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan-400 hover:underline"
            >
              Telegram’s Terms of Service
            </a>
            ,{" "}
            <a
              href="https://telegram.org/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan-400 hover:underline"
            >
              Telegram’s Privacy Policy
            </a>{" "}
            and the respective Terms of Service of each MA you access, if any.
            All of the aforementioned terms may be amended from time to time without notice.
          </p>

          <p className="mb-4">
            For clarity, your continued access to and use of MAF shall constitute your acceptance of
            these MA Terms and all other terms that are incorporated herein, including any updates or
            modifications to them from time to time.
          </p>

          <h2 className="mb-3 text-lg font-semibold text-amber-200">2. Mini Apps</h2>
          <p className="mb-4">
            All products and services offered via MAF are offered and managed by third-party SP.
            These SP are also responsible for any continued operation and maintenance for their MA
            on the Telegram platform. We are not affiliated with any of these SP, and they operate
            independently of Telegram. By using MAF on the Telegram platform, you acknowledge and
            agree that:
          </p>
          <ul className="mb-6 ml-6 list-disc space-y-2">
            <li>You are accessing a third-party service directly from its SP;</li>
            <li>Telegram only provides SP with access to third-party payment providers via its Payment Platform, and does not itself process payments or hold funds;</li>
            <li>SP may have additional terms as a part of their products or services with which you must comply;</li>
            <li>You fully acknowledge and explicitly assume any and all risks related to transactions with SP, and agree that we shall not be liable for any risks or adverse consequences arising from such transactions.</li>
          </ul>

          <p className="mb-4">
            The individual SP that operate MA are solely responsible for the content, products, goods,
            or services made available to you directly via their respective MA – including but not
            limited to quality, performance and availability. You should contact the respective SP
            directly with any queries, and any disputes shall be resolved directly with the respective SP.
          </p>

          <p className="mb-6">
            Cancellations or refunds for purchases from SP via MAF are subject to the applicable terms
            of the specific SP from which the purchase was made. Telegram has no role in processing
            payments and governing refund or cancellation charges. Any disputes must be resolved by
            contacting the SP directly, who is responsible for resolving the dispute.
          </p>

          <h2 className="mb-3 text-lg font-semibold text-amber-200">3. Payments</h2>
          <p className="mb-4">
            Telegram does not process payments. Instead, payments are processed by third-party payment
            providers, which are chosen by the SP for their MA, at the SP’s sole discretion.
          </p>

          <h3 className="mb-2 text-md font-semibold text-cyan-300">3.1. Payment Information</h3>
          <p className="mb-4">
            Telegram does not store your credit card details for purchases made via MAF. Such data is
            handled solely by third-party payment providers. See our Privacy Policy for more details.
          </p>

          <h3 className="mb-2 text-md font-semibold text-cyan-300">3.2. Payment-Related Disputes</h3>
          <p className="mb-6">
            Payments conducted or initiated through a MA are processed by a third-party payment provider,
            as agreed between you, the SP and the payment provider, which at times may coincide.
            Telegram does not handle, manage, oversee, verify or provide any sort of warranty over
            such transactions. Consequently, any disputes, claims, losses, misunderstandings, technical
            errors, or issues of any kind (both accidental and allegedly intentional) related to payments
            or transactions must be directed towards the respective payment provider or SP. Telegram
            bears no responsibility whatsoever and will not be a party to any payment-related disputes
            or discussions, nor is it liable for any losses or damages the parties involved may incur.
          </p>

          <h2 className="mb-3 text-lg font-semibold text-amber-200">4. Privacy</h2>
          <h3 className="mb-2 text-md font-semibold text-cyan-300">4.1. Data We Share</h3>
          <p className="mb-4">
            When you interact with a MA, it will automatically acquire your IP address. Additionally,
            depending on which MA you use and how it was opened, we may also share some basic data
            with it, like your Telegram user id, public Telegram name, username and profile picture,
            an IETF language tag of your client language, your premium subscription status and some
            color parameters related to your in-app theme.
          </p>

          <p className="mb-4">
            MA launched from the attachment menu in private chats will also receive similar information
            about your chat partner. MA launched from the attachment menu in channels and group chats
            may also receive the ID, type, title, username and photo of the chat in which they were opened.
          </p>

          <p className="mb-4">
            By utilizing the MAF, you expressly acknowledge and understand that such data will be
            shared with the SP that operates the MA you choose to access. Further, you agree not to
            hold us liable for any mismanagement, misuse, or mishandling of this data by the SP, under
            any circumstances.
          </p>

          <h3 className="mb-2 text-md font-semibold text-cyan-300">4.2. Data You Share</h3>
          <p className="mb-4">
            You may also choose to provide certain data to the MA, including but not limited to your
            phone number, text, media or locations in order to facilitate the service offered by its
            SP, or for any other reason as determined solely by you. By providing this data to the MA,
            you are in turn providing it to the SP, which is responsible for handling and storing any
            data provided to it.
          </p>

          <p className="mb-6">
            Any processing or collection of data by the SP via MAF is subject to any applicable terms
            between you and the SP. After transmitting it, Telegram does not have any access to or
            control over data shared between users and SP via MAF. Any data that is shared with Telegram
            itself is governed by the Telegram Privacy Policy. Accordingly, you agree not to hold
            Telegram liable should the SP mismanage, misuse, or mishandle the data you provide to it,
            under any circumstances.
          </p>

          <h2 className="mb-3 text-lg font-semibold text-amber-200">5. Disclaimers</h2>
          <p className="mb-4">
            To the maximum extent permitted under applicable law, MAF are offered to you on an “as is”
            and “as available” basis, and you agree to waive, and we categorically disclaim, any and
            all other warranties of any kind, whether express or implied, regardless of nature,
            including, without limitation, warranties of merchantability, fitness for a particular
            purpose, title or non-infringement warranties that arise from course of performance,
            course of dealing or usage in trade.
          </p>

          <p className="mb-4">
            Without limiting the foregoing, we do not represent or warrant: (a) that MAF, its contents
            and all goods or services provided therein are reliable, accurate, up to date, truthful,
            complete, functional, error-free, free of malware and any other harmful or otherwise
            unwanted elements; or (b) that the goods and services you have purchased and will receive
            directly from the SP will remain available, functional, performant, relevant or maintain
            any value or quality.
          </p>

          <p className="mb-4">
            You further acknowledge and agree that matters, issues, complaints and disputes pertaining
            to warranty, guarantee, quality and service shall be resolved in accordance with the terms
            set forth by the SP, and you consent to manage such concerns and disputes directly with
            the SP, without involving Telegram in any capacity.
          </p>

          <p className="mb-4">
            Since goods and services are provided by the respective SP, you recognize and agree that
            we shall have no obligation, liability or responsibility to you concerning the goods and
            services, their quality, functionality, performance, value or general availability.
          </p>

          <p className="mb-4">
            You further understand and agree that we will not be liable for any damages or losses due
            to or relating to:
          </p>
          <ul className="mb-4 ml-6 list-disc space-y-2">
            <li>Any inaccuracy, defect, error or omission of price data, including but not limited to cryptocurrency price data;</li>
            <li>Any error or delay in the transmission of price data, including but not limited to the transmission of your orders to both SP and payment providers;</li>
            <li>Interruption in any such data;</li>
            <li>Any routine, unannounced or unscheduled maintenance as we see fit, either carried out by us directly, by our partners or by SP;</li>
            <li>Any harm or damage incurred as a result of illegal actions by third parties that were not sanctioned by us;</li>
            <li>Any harm or damage resulting either directly or indirectly from user actions, negligence, omissions or violations of any applicable laws and governing terms;</li>
            <li>Any other exceptions as described herein or in any other terms that govern your use of MAF.</li>
          </ul>

          <p className="mb-4">
            You acknowledge and agree that these MA Terms govern the relationship between you and us.
            Any and all agreements, dealings, transactions, or any other form of engagement you may
            have with Service Providers are solely between you and the respective SP; this includes
            SP found through, accessed through, or promoted through the MAF. We have no liability,
            obligation, or responsibility to you in relation to any SP, including but not limited to
            their respective content, goods, services, terms either express or implied, or any other
            deliverables you obtained or intended to obtain from such SP, regardless of your optional
            engagement with the SP through their MA using Telegram’s MAF.
          </p>

          <p className="mb-4">
            By accepting these MA Terms, you acknowledge and fully understand that MA are operated by
            third parties. In light of this understanding, you agree that any and all legal actions,
            claims, or disputes arising out of or in relation to your usage of MA shall be exclusively
            directed towards the SP that operated the relevant MA. Further, to the maximum extent
            permitted under applicable law, no such legal recourse shall be initiated against Telegram.
          </p>

          <h3 className="mb-2 text-md font-semibold text-cyan-300">5.3. Indemnity</h3>
          <p className="mb-4">
            You accept and agree to grant Telegram and its subsidiaries, affiliates, officers, agents,
            contractors and employees absolute indemnity and to hold them harmless from and against
            any and all claims, actions, proceedings, obligations, investigations, demands, suits,
            expenses, costs and damages (including but not limited to legal fees, fines or penalties
            imposed by any authorities or regulatory institutions) arising from, related to, or in any
            way incurred as a result of your use of, conduct in connection with, your purchase, receipt
            of and access to services and goods from the SP via the MAF.
          </p>

          <h3 className="mb-2 text-md font-semibold text-cyan-300">5.4. Conflicts of Rules</h3>
          <p className="mb-6">
            Should any controversy arise between these MA Terms, the SP terms and any other provisions
            governing your use of MA, it shall be resolved in the manner that is most favorable to
            Telegram, to the full extent permitted under applicable law.
          </p>

          <h2 className="mb-3 text-lg font-semibold text-amber-200">6. Modification of MAF</h2>
          <p className="mb-4">
            We may, at our sole and absolute discretion and without liability, at any time and without
            notice, modify MAF in any way we deem necessary. We hold no liability for how these changes
            may affect access to and services provided by MA. SP are solely responsible for ensuring
            that their services are available to their users and compatible with MAF. These changes
            include but are not limited to:
          </p>
          <ul className="mb-6 ml-6 list-disc space-y-2">
            <li>Altering, suspending, or fully discontinuing features within the MA platform, including but not limited to the MAF itself;</li>
            <li>Imposing limits on or restricting access to certain SP;</li>
            <li>Restricting certain users from accessing MAF or the Telegram platform;</li>
            <li>Adjusting, modifying or radically reshaping the way in which users find, access, interact with or otherwise make use of MAF, to meet evolving technological, economical or regulatory standards.</li>
          </ul>

          <h2 className="mb-3 text-lg font-semibold text-amber-200">7. Changes to MA Terms</h2>
          <p className="mb-4">
            We will review and may update these MA Terms from time to time. Any changes to these MA
            Terms will become effective when we post the revised MAF Terms of Service on this page{" "}
            <a
              href="https://telegram.org/tos/mini-apps"
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan-400 hover:underline"
            >
              www.telegram.org/tos/mini-apps
            </a>
            . Please check our website frequently to see any updates or changes to our Terms.
          </p>

          <div className="mt-6 border-t border-amber-800/30 pt-4 text-center text-xs text-zinc-500">
            <p>Telegram — это облачный мессенджер для мобильных устройств и компьютеров. Быстрый и безопасный.</p>
            <p className="mt-2">
              <a
                href="https://telegram.org"
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan-400 hover:underline"
              >
                Telegram.org
              </a>
            </p>
            <p className="mt-4">Последнее обновление: {new Date().toLocaleDateString("ru-RU")}</p>
          </div>
        </div>
      </div>
    </div>
  );
}