import { ApiError } from "@/lib/tvapi/client";
import { ttMessages } from "./messagesTt";

/**
 * Строки островов на Solid. Словари `src/i18n/locales` живут на сборке, а
 * эти уезжают в браузер - держим их отдельно и небольшими.
 */
const ru = {
	"common.loading": "Загружаем…",
	"common.retry": "Повторить",
	"common.cancel": "Отмена",
	"common.save": "Сохранить",
	"common.remove": "Убрать",
	"common.add": "Добавить",
	"common.optional": "необязательно",
	"common.required": "обязательно",
	"common.error": "Что-то пошло не так",
	"common.network": "Нет связи с сервером каталога. Проверьте интернет и попробуйте ещё раз.",
	"common.tooMany": "Слишком много запросов. Подождите немного и попробуйте снова.",


	"center.back": "Все центры",
	"center.notFound": "Центр не найден",
	"center.suggest": "Предложить правку",
	"center.notFoundHint": "Возможно, его скрыли из каталога или адрес набран с ошибкой.",
	"center.contacts": "Контакты",
	"center.leader": "Руководитель",
	"center.facts": "Сведения",
	"center.features": "Особенности",
	"center.about": "О центре",
	"center.sources": "Источники",
	"center.online": "Онлайн-сообщество",
	"center.updated": "Обновлено",
	"center.published": "В каталоге с",
	"center.fallback": "Перевода пока нет - показываем по-русски.",

	"form.titleCreate": "Добавить центр",
	"form.titleEdit": "Правка: {name}",
	"form.titleFix": "Исправить заявку №{id}",
	"form.introCreate":
		"Расскажите о татарском, башкирском или крымскотатарском центре, которого нет в каталоге. Модератор проверит заявку и опубликует центр.",
	"form.introEdit":
		"Исправьте или дополните сведения о центре. Изменения появятся на сайте после проверки модератором.",
	"form.closed": "Приём заявок временно закрыт. Попробуйте позже.",
	"form.section.main": "О центре",
	"form.section.place": "Где находится",
	"form.section.contacts": "Связь",
	"form.section.more": "Дополнительно",
	"form.section.submitter": "О вас",
	"form.name": "Название",
	"form.nameRequired": "Укажите название центра.",
	"form.summary": "Коротко",
	"form.summaryHint": "Одна строка под названием в каталоге.",
	"form.about": "О центре",
	"form.aboutHint": "Чем занимается, когда появился, какие проходят события.",
	"form.category": "Народ",
	"form.categoryPick": "Выберите",
	"form.online": "Онлайн-сообщество без своего места",
	"form.country": "Страна",
	"form.countryPick": "Выберите страну",
	"form.federalDistrict": "Федеральный округ",
	"form.region": "Регион, область, штат",
	"form.district": "Район",
	"form.city": "Город",
	"form.address": "Адрес",
	"form.links": "Ссылки",
	"form.linksHint": "Сайт, Instagram, Telegram, VK… Нужна хотя бы одна ссылка, телефон или email.",
	"form.linkPlaceholder": "https://",
	"form.phones": "Телефоны",
	"form.phonePlaceholder": "+7 701 123 45 67",
	"form.emails": "Email",
	"form.leader": "Руководитель",
	"form.features": "Особенности",
	"form.featuresHint": "Короткие строки: уроки языка, хор, праздники.",
	"form.facts": "Прочее",
	"form.factsHint": "ОГРН, БИН, год основания.",
	"form.factLabel": "Подпись",
	"form.factValue": "Значение",
	"form.sources": "Источники",
	"form.sourcesHint": "Откуда сведения: статьи, страницы организаций.",
	"form.sourceTitle": "Подпись",
	"form.submitterName": "Ваше имя",
	"form.role": "Кем вы приходитесь центру",
	"form.phone": "Телефон",
	"form.telegram": "Telegram",
	"form.email": "Email",
	"form.contactGroup": "Как с вами связаться",
	"form.contactHint": "Чтобы модератор мог уточнить детали. На сайте контакты не публикуются.",
	"form.comment": "Комментарий для модератора",
	"form.commentHint": "Откуда сведения, что изменилось.",
	"form.submit": "Отправить заявку",
	"form.submitFix": "Сохранить исправления",
	"form.sending": "Отправляем…",
	"form.consent": "Нажимая кнопку, вы соглашаетесь с",
	"form.policy": "политикой обработки данных",
	"form.translationHint":
		"Вы заполняете английскую версию. Тексты на других языках не изменятся.",
	"form.fallbackHint": "Перевода нет - поле показано по-русски. Ваш текст станет английской версией.",
	"form.fixErrors": "Проверьте поля, отмеченные ниже.",
	"form.noChanges": "Вы ничего не изменили.",
	"form.versionConflict": "Пока вы редактировали, центр уже изменили. Откройте форму заново.",
	"form.sentTitle": "Заявка №{id} отправлена",
	"form.sentText":
		"Модератор проверит её в ближайшее время. Статус можно посмотреть в «Моих заявках» - ключ заявки сохранён в этом браузере.",
	"form.sentKey": "Ключ заявки - сохраните его, если будете проверять статус с другого устройства:",
	"form.toMy": "Мои заявки",
	"form.another": "Отправить ещё одну",
	"form.captchaNotice": "Форма защищена reCAPTCHA.",

	"my.title": "Мои заявки",
	"my.intro":
		"Заявки, отправленные из этого браузера. Ключи хранятся только у вас: очистите данные сайта - и список пропадёт.",
	"my.empty": "Заявок пока нет",
	"my.emptyHint": "Добавьте центр, которого нет в каталоге, или предложите правку на странице центра.",
	"my.add": "Добавить центр",
	"my.keyLabel": "Добавить заявку по ключу",
	"my.keyPlaceholder": "Ключ заявки",
	"my.keyAdd": "Добавить",
	"my.keyNotFound": "Заявка с таким ключом не найдена.",
	"my.kind.create": "Новый центр",
	"my.kind.edit": "Правка",
	"my.status.pending": "На проверке",
	"my.status.approved": "Одобрена",
	"my.status.rejected": "Отклонена",
	"my.status.withdrawn": "Отозвана",
	"my.sent": "Отправлена",
	"my.decided": "Решение",
	"my.reason": "Причина",
	"my.changed": "Что меняется",
	"my.open": "Страница центра",
	"my.fix": "Исправить",
	"my.withdraw": "Отозвать",
	"my.withdrawConfirm": "Отозвать заявку? Это нельзя отменить.",
	"my.forget": "Убрать из списка",

	"role.representative": "Представитель центра",
	"role.member": "Участник",
	"role.other": "Просто знаю о нём",
};

type Key = keyof typeof ru;

const en: Record<Key, string> = {
	"common.loading": "Loading…",
	"common.retry": "Try again",
	"common.cancel": "Cancel",
	"common.save": "Save",
	"common.remove": "Remove",
	"common.add": "Add",
	"common.optional": "optional",
	"common.required": "required",
	"common.error": "Something went wrong",
	"common.network": "Can't reach the catalog server. Check your connection and try again.",
	"common.tooMany": "Too many requests. Wait a moment and try again.",


	"center.back": "All centers",
	"center.notFound": "Center not found",
	"center.suggest": "Suggest an edit",
	"center.notFoundHint": "It may have been hidden from the catalog, or the address has a typo.",
	"center.contacts": "Contacts",
	"center.leader": "Leader",
	"center.facts": "Details",
	"center.features": "Highlights",
	"center.about": "About",
	"center.sources": "Sources",
	"center.online": "Online community",
	"center.updated": "Updated",
	"center.published": "Listed since",
	"center.fallback": "No translation yet - showing the Russian text.",

	"form.titleCreate": "Add a center",
	"form.titleEdit": "Edit: {name}",
	"form.titleFix": "Fix submission #{id}",
	"form.introCreate":
		"Tell us about a Tatar, Bashkir or Crimean Tatar center that is not in the catalog. A moderator will review it and publish the center.",
	"form.introEdit":
		"Correct or extend the center's details. Changes go live after a moderator reviews them.",
	"form.closed": "Submissions are temporarily closed. Please try later.",
	"form.section.main": "About the center",
	"form.section.place": "Location",
	"form.section.contacts": "Contacts",
	"form.section.more": "More",
	"form.section.submitter": "About you",
	"form.name": "Name",
	"form.nameRequired": "Enter the center name.",
	"form.summary": "In short",
	"form.summaryHint": "One line under the name in the catalog.",
	"form.about": "About",
	"form.aboutHint": "What it does, when it started, what events it holds.",
	"form.category": "People",
	"form.categoryPick": "Choose",
	"form.online": "Online community without a venue",
	"form.country": "Country",
	"form.countryPick": "Choose a country",
	"form.federalDistrict": "Federal district",
	"form.region": "Region, province, state",
	"form.district": "District",
	"form.city": "City",
	"form.address": "Address",
	"form.links": "Links",
	"form.linksHint": "Website, Instagram, Telegram, VK… At least one link, phone or email is required.",
	"form.linkPlaceholder": "https://",
	"form.phones": "Phones",
	"form.phonePlaceholder": "+1 202 555 0123",
	"form.emails": "Email",
	"form.leader": "Leader",
	"form.features": "Highlights",
	"form.featuresHint": "Short lines: language classes, choir, holidays.",
	"form.facts": "Other",
	"form.factsHint": "Registration number, year founded.",
	"form.factLabel": "Label",
	"form.factValue": "Value",
	"form.sources": "Sources",
	"form.sourcesHint": "Where the information comes from: articles, official pages.",
	"form.sourceTitle": "Label",
	"form.submitterName": "Your name",
	"form.role": "Your relation to the center",
	"form.phone": "Phone",
	"form.telegram": "Telegram",
	"form.email": "Email",
	"form.contactGroup": "How to reach you",
	"form.contactHint": "So a moderator can clarify details. Contacts are never published.",
	"form.comment": "Note for the moderator",
	"form.commentHint": "Where the information comes from, what changed.",
	"form.submit": "Send",
	"form.submitFix": "Save changes",
	"form.sending": "Sending…",
	"form.consent": "By sending you agree to the",
	"form.policy": "privacy policy",
	"form.translationHint": "You are filling in the English version. Texts in other languages stay as they are.",
	"form.fallbackHint": "No translation yet - the field shows Russian. Your text becomes the English version.",
	"form.fixErrors": "Check the fields marked below.",
	"form.noChanges": "You haven't changed anything.",
	"form.versionConflict": "The center changed while you were editing. Reopen the form.",
	"form.sentTitle": "Submission #{id} sent",
	"form.sentText":
		"A moderator will review it soon. Track its status in “My submissions” - the key is saved in this browser.",
	"form.sentKey": "Submission key - keep it to check the status from another device:",
	"form.toMy": "My submissions",
	"form.another": "Send another",
	"form.captchaNotice": "This form is protected by reCAPTCHA.",

	"my.title": "My submissions",
	"my.intro":
		"Submissions sent from this browser. The keys are stored only on your device: clear site data and the list is gone.",
	"my.empty": "No submissions yet",
	"my.emptyHint": "Add a center that is missing from the catalog, or suggest an edit on a center page.",
	"my.add": "Add a center",
	"my.keyLabel": "Add a submission by key",
	"my.keyPlaceholder": "Submission key",
	"my.keyAdd": "Add",
	"my.keyNotFound": "No submission with this key.",
	"my.kind.create": "New center",
	"my.kind.edit": "Edit",
	"my.status.pending": "Under review",
	"my.status.approved": "Approved",
	"my.status.rejected": "Rejected",
	"my.status.withdrawn": "Withdrawn",
	"my.sent": "Sent",
	"my.decided": "Decision",
	"my.reason": "Reason",
	"my.changed": "Changes",
	"my.open": "Center page",
	"my.fix": "Fix",
	"my.withdraw": "Withdraw",
	"my.withdrawConfirm": "Withdraw the submission? This can't be undone.",
	"my.forget": "Remove from list",

	"role.representative": "Center representative",
	"role.member": "Member",
	"role.other": "I just know about it",
};

const tt = ttMessages as Record<Key, string>;

export type Lang = "ru" | "en" | "tt";
export type T = (key: Key, values?: Record<string, string | number>) => string;

export function messages(lang: Lang): T {
	const dict = lang === "en" ? en : lang === "tt" ? tt : ru;
	return (key, values) => {
		const template = dict[key] ?? ru[key] ?? key;
		return values
			? template.replace(/\{(\w+)\}/g, (_, token: string) => String(values[token] ?? ""))
			: template;
	};
}

/**
 * Текст ошибки для человека. `detail` сервер пишет по-русски - на русской
 * странице его и показываем, на остальных - свои строки по коду.
 */
export function errorText(error: unknown, lang: Lang): string {
	const t = messages(lang);
	if (!(error instanceof ApiError)) return t("common.error");
	if (error.code === "network") return t("common.network");
	if (error.status === 429) return t("common.tooMany");
	if (error.code === "no_changes") return t("form.noChanges");
	if (error.code === "version_conflict") return t("form.versionConflict");
	if (error.code === "invalid") return t("form.fixErrors");
	return lang === "ru" && error.problem.detail ? error.problem.detail : t("common.error");
}
