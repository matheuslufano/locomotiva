/* Personal data lives only in this page's memory. The backend is authoritative. */
const $ = (id) => document.getElementById(`locomotiva-${id}`);
let config,
  availability = [],
  step = 1,
  selectedDate = "",
  photo = null,
  busy = false,
  completed = false;
let requestKey = crypto.randomUUID();
const inviteToken =
  new URLSearchParams(location.hash.slice(1)).get("convite") || "";
if (inviteToken) history.replaceState(null, "", location.pathname);
const form = $("form");
const stepPages = ["condicoes.html", "seus-dados.html", "sua-visita.html"];
const requestedStep = Math.max(
  1,
  stepPages.indexOf(location.pathname.split("/").pop()) + 1,
);
let reachedStep = 1;

// A refresh starts with renewed consent. Personal data stays in this document's memory.
history.replaceState({ step: 1 }, "", new URL(stepPages[0] + location.hash, location.href));
window.addEventListener("popstate", (event) => {
  if (completed) { history.replaceState(null, "", "./solicitacao-recebida.html"); return; }
  const target = event.state?.step || 1;
  showStep(Math.min(target, reachedStep), true, false);
});
const api = window.LocomotivaApi.request;
function message(text) {
  $("status").textContent = text;
}
function showStep(value, focus = true, navigate = true) {
  step = value;
  $("registration").dataset.step = String(step);
  document.body.dataset.registrationStep = String(step);
  if (step === 1) $("consents").append($("approval-notice"));
  else form.querySelector(".form-actions").before($("approval-notice"));
  reachedStep = Math.max(reachedStep, step);
  if (navigate) history.pushState({ step }, "", new URL(stepPages[step - 1], location.href));
  const titles = ["Antes de participar", "Vamos conhecer você", "Escolha sua visita"];
  const captions = ["Condições", "Seus dados", "Sua visita"];
  $("registration-title").textContent = titles[step - 1];
  $("step-caption").textContent = `Etapa ${step} de 3 • ${captions[step - 1]}`;
  document.title = `${titles[step - 1]} | Locomotiva Restaurante`;
  $("next").textContent = step === 1
    ? "Aceitar e continuar →"
    : "Escolher visita →";
  for (let n = 1; n <= 3; n++) {
    $(`step-${n}`).hidden = n !== step;
    $(`step-${n}`).disabled = n !== step;
    if (n === step) $(`progress-${n}`).setAttribute("aria-current", "step");
    else $(`progress-${n}`).removeAttribute("aria-current");
  }
  $("back").hidden = step === 1;
  $("next").hidden = step === 3;
  $("submit").hidden = step !== 3 || config.localPreview;
  $("preview-submit").hidden = step !== 3 || !config.localPreview;
  window.LocomotivaVisitControls.sync();
  if (step === 3) {
    review();
    if (config.localPreview && !availability.length) {
      message("Os horários de chegada ainda precisam ser configurados no painel para testar a seleção da visita.");
    }
  }
  window.LocomotivaDesktopLayout.sync(step);
  if (focus) {
    $("registration-title").focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: "instant" });
  }
}
function documents() {
  $("documents").replaceChildren();
  const commercial = `Visitas: 21 a 30 de novembro de 2026. Um influenciador por data.\nVoucher de R$ 200: ${config.voucher}\nAcompanhantes: ${config.companions}\nExcedente: ${config.excess}\nSaldo restante: ${config.balance}\nConteúdo: 2 Stories de aquecimento antes da visita + 4 Stories OU 1 Reels de 60 segundos no dia da visita.\nPublicação: ${config.publication}\nPerfis: ${config.tags}\nCancelamento e ausência: ${config.cancellation}\nEndereço: ${config.address}\nContato: ${config.contact}\n\n${config.conditions}`;
  const image = `${config.imageTerm}\n\nCanais: ${config.imageChannels}\nFinalidade: ${config.imagePurpose}\nPrazo: ${config.imageDuration}\nEdição: ${config.imageEditing}\nImpulsionamento: ${config.imagePromotion}`;
  for (const [key, title, text] of [
    ["conditions", "Condições completas da campanha", commercial],
    ["image", "Termo de autorização de uso de imagem", image],
    ["privacy", "Aviso de privacidade", config.privacy],
  ]) {
    const details = document.createElement("details"),
      summary = document.createElement("summary"),
      p = document.createElement("div");
    details.id = `locomotiva-document-${key}`;
    summary.textContent = title;
    p.className = "document-text";
    p.textContent = config.published || config.localPreview
      ? `${config.localPreview ? "PRÉVIA LOCAL — leitura simulada, sem aceite oficial" : "Versão " + config.revision}\n\n${text}`
      : "O documento completo será disponibilizado quando o cadastro for aberto.";
    details.append(summary, p);
    $("documents").append(details);
  }
}
async function load() {
  const result = await api("config");
  if (!result.config.published && document.querySelector('meta[name="locomotiva-preview"]')?.content === "true") {
    const response = await fetch("./preview-config.json", { cache: "no-store" });
    if (!response.ok) throw new Error("Não foi possível carregar a prévia local.");
    const draft = await response.json();
    result.config = { ...result.config, ...draft, published: false };
    if (!result.availability.length && draft.previewAvailability) {
      result.availability = draft.previewAvailability;
    }
  }
  const initial = !config,
    changed = config && config.revision !== result.config.revision;
  config = result.config;
  availability = result.availability;
  if (changed) {
    for (const k of ["conditions", "image", "privacy"])
      $(`accept-${k}`).checked = false;
    reachedStep = 1;
    showStep(1);
    message(
      "Os documentos foram atualizados. Leia e aceite a nova versão para continuar.",
    );
  }
  if (initial || changed) {
    documents();
    if (config.published || config.localPreview) {
      $("conditions-summary").textContent = config.voucher || "Consulte as condições completas para conhecer as regras do voucher.";
    }
  }
  if (initial && config.localPreview && availability.some((day) => day.date === "2026-11-24" && day.state === "AVAILABLE")) {
    selectedDate = "2026-11-24";
    $("period").value = "lunch";
  }
  dates();
  times();
  if (initial && config.localPreview && selectedDate === "2026-11-24" && [...$("time").options].some((option) => option.value === "12:00")) {
    $("time").value = "12:00";
    window.LocomotivaVisitControls.sync();
  }
  form.hidden = completed;
  for (const key of ["conditions", "image", "privacy"]) {
    const checkbox = $("accept-" + key);
    checkbox.disabled = !config.published && !config.localPreview;
    if (config.localPreview && !checkbox.dataset.previewLabel) {
      checkbox.parentElement.append(" (simulação local)");
      checkbox.dataset.previewLabel = "true";
    }
  }
  $("next").disabled = !config.published && !config.localPreview;
  $("registration-closed").hidden = config.published;
  if (config.localPreview) {
    $("registration-closed").textContent = "Prévia local: você pode testar as etapas sem preencher dados pessoais. Os aceites são simulados e o envio de inscrições reais está desabilitado.";
  }
  if (initial) {
    const openingStep = config.localPreview ? requestedStep : 1;
    showStep(openingStep, false, false);
    history.replaceState({ step: openingStep }, "", new URL(stepPages[openingStep - 1] + location.hash, location.href));
    const target = location.hash.slice(1);
    if (target.startsWith("locomotiva-document-")) {
      const documentDetails = document.getElementById(target);
      if (documentDetails) {
        $("terms-dialog").showModal();
        documentDetails.open = true;
        documentDetails.scrollIntoView();
      }
    }
  }
  if (!config.published && !config.localPreview) {
    $("next").textContent = "Cadastro disponível em breve";
    message("");
  }
  else if (!availability.some((d) => d.state === "AVAILABLE")) {
    message(config.localPreview ? "" : "Não há datas disponíveis no momento.");
    $("submit").disabled = true;
  } else if (initial) message("");
}
function dates() {
  $("dates").replaceChildren();
  for (const day of availability) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "date-option";
    button.id = `locomotiva-date-${day.date}`;
    button.disabled = day.state !== "AVAILABLE";
    button.setAttribute("aria-pressed", String(selectedDate === day.date));
    button.textContent = day.date.slice(-2);
    const label = document.createElement("span");
    label.textContent = "nov.";
    button.setAttribute("aria-label", day.date.slice(-2) + " de novembro" + (button.disabled ? ", indisponível" : ", disponível"));
    button.append(label);
    button.onclick = () => {
      selectedDate = day.date;
      dates();
      times();
      review();
    };
    $("dates").append(button);
  }
  if (
    !availability.some(
      (d) => d.date === selectedDate && d.state === "AVAILABLE",
    )
  )
    selectedDate = "";
  $("submit").disabled =
    busy || completed || !config.published || !availability.some((d) => d.state === "AVAILABLE");
}
function times() {
  const old = $("time").value,
    day = availability.find((d) => d.date === selectedDate);
  $("time").replaceChildren(new Option("Selecione", ""));
  for (const time of day?.times[$("period").value] || [])
    $("time").add(new Option(time, time));
  if ([...$("time").options].some((o) => o.value === old))
    $("time").value = old;
  $("time-label").textContent = $("period").value === "lunch" ? "Horário (Almoço)" : $("period").value === "dinner" ? "Horário (Jantar)" : "Horário de chegada";
  $("time-empty").hidden = $("time").options.length > 1;
  $("time-empty").textContent = day && $("period").value
    ? "Nenhum horário disponível neste período."
    : "Selecione uma data e um período para consultar os horários.";
  window.LocomotivaVisitControls.sync();
}
function data() {
  const values = {};
  for (const field of form.querySelectorAll("[name]"))
    values[field.name] = field.value;
  return values;
}
function review() {
  const d = data();
  $("visit-summary-name").textContent = d.name || "Seu nome será exibido após o preenchimento";
  const period = d.period === "lunch" ? "Almoço" : d.period === "dinner" ? "Jantar" : "Escolha o período";
  $("visit-summary-date").textContent = selectedDate
    ? selectedDate.split("-").reverse().join("/") + " • " + period + (d.time ? " às " + d.time : "")
    : "Selecione sua visita";
  $("visit-summary-content").textContent = (d.modality === "STORIES" ? "4 Stories" : "1 Reels de 60 segundos") + " • Voucher R$ 200";
  $("review").textContent =
    `Revise sua solicitação\n\n${d.name}\nCPF: ***.***.***-${d.cpf.replace(/\D/g, "").slice(-2)}\n${d.email} · ${d.phone}\n${d.city} / ${d.uf}\n${d.instagram} · ${d.profileUrl}\n\nVisita: ${selectedDate ? selectedDate.split("-").reverse().join("/") : "Escolha uma data"} às ${d.time || "—"} (${d.period === "lunch" ? "almoço" : d.period === "dinner" ? "jantar" : "selecione o período"})\nVoucher de R$ 200: ${config.voucher}\nAquecimento: 2 Stories antes da visita.\nConteúdo presencial: ${d.modality === "STORIES" ? "4 Stories" : "1 Reels de 60 segundos"}\n\nSua solicitação será analisada. Aguarde aprovação expressa por e-mail.`;
}
function validateProfile() {
  const handle = $("instagram").value.replace(/^@/, "").toLowerCase();
  let url;
  try {
    url = new URL($("profile-url").value);
  } catch {
    throw new Error("Informe o link completo do Instagram.");
  }
  if (
    !/^[a-z0-9_.]{1,30}$/.test(handle) ||
    url.protocol !== "https:" ||
    !["instagram.com", "www.instagram.com"].includes(url.hostname) ||
    url.pathname.replace(/\/$/, "").toLowerCase() !== `/${handle}` ||
    url.search ||
    url.hash ||
    url.port ||
    url.username ||
    url.password
  )
    throw new Error(
      "O usuário e o link do Instagram devem corresponder ao mesmo perfil.",
    );
}
$("next").onclick = async () => {
  if (!config?.published && !config?.localPreview) return;
  const previewingPersonalData = config.localPreview && step === 2;
  if (!previewingPersonalData && !form.reportValidity()) return;
  try {
    if (step === 2) {
      if (!config.localPreview) {
        if (
          $("email").value.trim().toLowerCase() !==
          $("email-confirmation").value.trim().toLowerCase()
        ) {
          throw new Error("Os e-mails não conferem.");
        }
        validateProfile();
      }
      const revision = config.revision;
      await load();
      if (revision !== config.revision || (!config.published && !config.localPreview)) return;
    }
    message("");
    showStep(step + 1);
  } catch (e) {
    message(e.message);
  }
};
$("back").onclick = () => showStep(step - 1);
$("period").onchange = () => {
  times();
  review();
};
$("time").onchange = review;
$("modality").onchange = review;
for (const uf of "AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO".split(
  " ",
))
  $("uf").add(new Option(uf, uf));
for (const key of ["instagram", "profile-url"])
  $(key).oninput = () => {
    $("profile-confirmed").checked = false;
    $("open-profile").hidden = true;
  };
$("name").addEventListener("input", () => {
  $("profile-name").textContent = $("name").value.trim() || "Seu perfil";
});
$("check-profile").onclick = async () => {
  try {
    validateProfile();
    $("open-profile").href = "https://www.instagram.com/" + $("instagram").value.replace(/^@/, "").toLowerCase() + "/";
    $("open-profile").hidden = false;
    const p = await api("profile", {
      instagram: $("instagram").value,
      profileUrl: $("profile-url").value,
    });
    $("profile-status").textContent =
      `Perfil: @${p.instagram}. Foto automática indisponível nesta campanha. Confira o perfil informado ou envie uma foto opcional.`;
  } catch (e) {
    message(e.message);
  }
};
$("photo-upload").onchange = async (event) => {
  const file = event.target.files[0];
  photo = null;
  $("photo-preview").src = "./profile-placeholder.svg";
  if (!file) return;
  if (
    file.size > 512000 ||
    !["image/png", "image/jpeg", "image/webp"].includes(file.type)
  ) {
    message("Envie PNG, JPEG ou WebP de até 500 KB.");
    event.target.value = "";
    return;
  }
  try {
    photo = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
    $("photo-preview").src = photo;
    message("");
  } catch {
    message("Não foi possível ler a foto. Você pode continuar sem ela.");
  }
};
$("preview-submit").onclick = () => {
  if (!config?.localPreview || completed) return;
  const submitted = data();
  if (!selectedDate || !submitted.period || !submitted.time) {
    message("Escolha a data, o período e o horário para visualizar o resumo.");
    return;
  }
  completed = true;
  form.hidden = true;
  window.LocomotivaReceipt.show({
    date: selectedDate,
    time: submitted.time,
    email: submitted.email || "E-mail não informado na prévia",
    protocol: "Simulação local — sem protocolo",
  }, submitted, { preview: true });
  message("");
};
form.onsubmit = async (event) => {
  event.preventDefault();
  if (busy || completed || !config?.published) return;
  if (step !== 3) { $("next").click(); return; }
  if (!selectedDate) {
    message("Escolha uma data disponível.");
    return;
  }
  if (
    !["conditions", "image", "privacy"].every((k) => $(`accept-${k}`).checked)
  ) {
    showStep(1);
    return;
  }
  busy = true;
  $("submit").disabled = true;
  message("Enviando sua solicitação…");
  try {
    const submitted = data();
    const result = await api("registrations", {
      ...submitted,
      date: selectedDate,
      photo,
      profileConfirmed: $("profile-confirmed").checked,
      revision: config.revision,
      acceptances: { conditions: true, image: true, privacy: true },
      requestKey,
      inviteToken,
    });
    completed = true;
    form.hidden = true;
    window.LocomotivaReceipt.show(result, submitted);
    message("");
  } catch (e) {
    const error = e.message;
    try {
      await load();
      times();
    } catch {
      /* Keep the current fields and original error. */
    }
    message(error);
    if (e.status === 412) showStep(1);
    if (e.status === 409) requestKey = crypto.randomUUID();
  } finally {
    busy = false;
    dates();
  }
};
load().catch((error) => message(error.message));
setInterval(() => {
  if (!busy && !completed && step === 3)
    load()
      .then(() => {
        times();
        review();
      })
      .catch(() =>
        message(
          "Não foi possível atualizar a disponibilidade. Ela será conferida novamente ao enviar.",
        ),
      );
}, 30000);

window.LocomotivaVisitControls.initialize();
$("read-terms").addEventListener("click", (event) => {
  event.preventDefault();
  const terms = $("document-conditions");
  if (terms) terms.open = true;
  $("terms-dialog").showModal();
});
$("close-terms").addEventListener("click", () => $("terms-dialog").close());
