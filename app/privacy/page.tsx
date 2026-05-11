"use client";

import { useRouter } from "next/navigation";

export default function PrivacyPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#0c0e14] text-amber-50">
      {/* Верхняя панель */}
      <div className="sticky top-0 z-20 flex items-center justify-between border-b border-amber-900/20 bg-[#0a0e14]/95 px-3 py-3 backdrop-blur-[8px]">
        <button
          onClick={() => router.back()}
          className="tap-target flex items-center gap-2 rounded-md border-2 border-amber-700/60 bg-[#120f0c] px-3 py-1.5 font-pixel text-[11px] text-amber-100 transition hover:bg-amber-900/30 active:scale-95"
        >
          <span>←</span>
          Назад
        </button>
        <h1 className="font-pixel text-sm font-bold uppercase tracking-wider text-amber-200/80">
          Политика конфиденциальности
        </h1>
        <div className="w-16" />
      </div>

      {/* Контент */}
      <div className="mx-auto max-w-3xl p-4 sm:p-6">
        <div className="rounded-2xl border border-amber-800/30 bg-black/40 p-4 text-sm leading-relaxed text-zinc-300 sm:p-6 sm:text-base">
          <h1 className="mb-4 text-center font-pixel text-xl text-amber-100 sm:text-2xl">
            Политика конфиденциальности игры «Crypto Tap»
          </h1>
          <p className="mb-4 text-center text-xs text-zinc-500">
            Последнее обновление: {new Date().toLocaleDateString("ru-RU")}
          </p>

          <div className="mb-6 h-px bg-gradient-to-r from-transparent via-amber-700/50 to-transparent" />

          <h2 className="mb-3 text-lg font-semibold text-amber-200">1. Какие данные мы собираем</h2>
          <p className="mb-4">
            При использовании нашего мини-приложения через Telegram мы собираем следующую информацию:
          </p>
          <ul className="mb-6 ml-6 list-disc space-y-2">
            <li>
              <span className="font-semibold text-cyan-300">Telegram ID</span> — для уникальной идентификации игрока
            </li>
            <li>
              <span className="font-semibold text-cyan-300">Имя пользователя и фотография профиля</span> — для
              отображения в игре и лидерборде
            </li>
            <li>
              <span className="font-semibold text-cyan-300">Игровой прогресс</span> — количество монет, кристаллов,
              купленные улучшения и достижения
            </li>
            <li>
              <span className="font-semibold text-cyan-300">IP-адрес</span> — для технического обеспечения работы
              приложения и защиты от злоупотреблений
            </li>
          </ul>

          <h2 className="mb-3 text-lg font-semibold text-amber-200">2. Как мы используем ваши данные</h2>
          <p className="mb-4">Собранные данные используются исключительно для:</p>
          <ul className="mb-6 ml-6 list-disc space-y-2">
            <li>Сохранения игрового прогресса между сессиями</li>
            <li>Формирования рейтингов (лидерборд) на основе игровых достижений</li>
            <li>Реферальной системы — учёта приглашённых друзей</li>
            <li>Отображения профиля игрока</li>
            <li>Анализа популярности игровых механик для улучшения игрового опыта</li>
          </ul>

          <h2 className="mb-3 text-lg font-semibold text-amber-200">3. Передача данных третьим лицам</h2>
          <p className="mb-4">
            Мы <span className="font-semibold text-green-400">НЕ ПЕРЕДАЁМ</span> ваши персональные данные третьим лицам,
            за исключением случаев, предусмотренных законодательством.
          </p>
          <p className="mb-6">
            Telegram, как платформа для мини-приложения, может получать базовую информацию о вашем взаимодействии с
            приложением в соответствии с{" "}
            <a
              href="https://telegram.org/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan-400 hover:underline"
            >
              Политикой конфиденциальности Telegram
            </a>
            .
          </p>

          <h2 className="mb-3 text-lg font-semibold text-amber-200">4. Хранение данных и безопасность</h2>
          <p className="mb-4">
            Все данные хранятся на защищённых серверах. Мы принимаем разумные меры для защиты вашей информации от
            несанкционированного доступа, изменения или уничтожения.
          </p>
          <p className="mb-6">
            Вы можете запросить удаление всех ваших данных, связанных с игрой, обратившись к разработчику через
            Telegram-бота.
          </p>

          <h2 className="mb-3 text-lg font-semibold text-amber-200">5. Ваши права</h2>
          <p className="mb-4">В соответствии с законодательством вы имеете право:</p>
          <ul className="mb-6 ml-6 list-disc space-y-2">
            <li>Получить информацию о том, какие данные о вас хранятся</li>
            <li>Запросить исправление неточных данных</li>
            <li>Запросить удаление ваших данных</li>
            <li>Отозвать согласие на обработку данных</li>
          </ul>

          <h2 className="mb-3 text-lg font-semibold text-amber-200">6. Возрастные ограничения</h2>
          <p className="mb-6">
            Наше приложение не предназначено для детей младше 13 лет. Если нам станет известно, что мы собрали
            персональные данные ребёнка младше 13 лет без подтверждённого согласия родителей, мы удалим такую
            информацию.
          </p>

          <h2 className="mb-3 text-lg font-semibold text-amber-200">7. Изменения в политике конфиденциальности</h2>
          <p className="mb-4">
            Мы можем время от времени обновлять нашу Политику конфиденциальности. О любых изменениях мы уведомим вас
            через наше мини-приложение или Telegram-канал.
          </p>

          <h2 className="mb-3 text-lg font-semibold text-amber-200">8. Контакты</h2>
          <p className="mb-4">Если у вас есть вопросы, касающиеся нашей Политики конфиденциальности, пожалуйста, свяжитесь с нами:</p>
          <ul className="mb-6 ml-6 list-disc space-y-2">
            <li>Через Telegram-бота разработчика</li>
            <li>По электронной почте: support@cryptotap.com</li>
          </ul>

          <div className="mt-6 rounded-lg border border-cyan-500/20 bg-cyan-950/30 p-4 text-center">
            <p className="text-xs text-cyan-300">
              Используя наше мини-приложение, вы подтверждаете, что ознакомились с данной Политикой конфиденциальности и
              соглашаетесь с её условиями.
            </p>
          </div>

          <div className="mt-6 border-t border-amber-800/30 pt-4 text-center text-xs text-zinc-500">
            <p>© {new Date().getFullYear()} Crypto Tap. Все права защищены.</p>
          </div>
        </div>
      </div>
    </div>
  );
}