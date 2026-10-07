// ==========================================================
// PECKING LOUNGE DIGITAL MENU
// ==========================================================

// 1. PUT YOUR GOOGLE APPS SCRIPT WEB APP URL HERE
const API_URL = "https://script.google.com/macros/s/AKfycbycWPg0l0nFhJy-u4gvxyok8wxPDyXSev2DGDbfpmFQ3lGwm_8Wc50LOE1sgq1mZr0B/exec";

// 2. PUT YOUR GOOGLE MAPS LINK HERE
const MAP_URL = "https://maps.app.goo.gl/ZCKGiSWEmrhCM3dY7";

let menuItems = [];
let selectedMainGroup = "ALL";
let selectedSubgroup = "ALL";
let searchText = "";

const menuGrid = document.getElementById("menuGrid");
const mainGroups = document.getElementById("mainGroups");
const subgroups = document.getElementById("subgroups");
const searchInput = document.getElementById("searchInput");
const clearSearch = document.getElementById("clearSearch");
const statusEl = document.getElementById("status");
const emptyState = document.getElementById("emptyState");
const resetFilters = document.getElementById("resetFilters");
const mapLink = document.getElementById("mapLink");

document.getElementById("year").textContent = new Date().getFullYear();

if (MAP_URL && !MAP_URL.includes("YOUR_")) {
  mapLink.href = MAP_URL;
} else {
  mapLink.addEventListener("click", (e) => e.preventDefault());
  mapLink.title = "Add your Google Maps link in script.js";
}

searchInput.addEventListener("input", () => {
  searchText = searchInput.value.trim().toLowerCase();
  clearSearch.style.display = searchText ? "block" : "none";
  renderMenu();
});

clearSearch.addEventListener("click", () => {
  searchInput.value = "";
  searchText = "";
  clearSearch.style.display = "none";
  renderMenu();
  searchInput.focus();
});

resetFilters.addEventListener("click", resetAllFilters);

async function loadMenu() {
  if (!API_URL || API_URL.includes("YOUR_")) {
    statusEl.textContent = "Add your Google Apps Script URL in script.js";
    return;
  }

  try {
    statusEl.textContent = "Loading menu...";

    const response = await fetch(API_URL, {
      method: "GET",
      cache: "no-store"
    });

    if (!response.ok) throw new Error("Could not load menu");

    const data = await response.json();

    if (!Array.isArray(data)) {
      throw new Error("Invalid menu data");
    }

    menuItems = data.map(item => ({
      mainGroup: clean(item.mainGroup),
      subgroup: clean(item.subgroup),
      item: clean(item.item),
      price: item.price,
      description: clean(item.description),
      tag: clean(item.tag),
      image: clean(item.image)
    }));

    statusEl.textContent = `${menuItems.length} menu item${menuItems.length === 1 ? "" : "s"}`;
    buildMainGroups();
    renderMenu();

  } catch (error) {
    console.error(error);
    statusEl.textContent = "Unable to load the menu. Please try again.";
    menuGrid.innerHTML = "";
  }
}

function clean(value) {
  return value === null || value === undefined ? "" : String(value).trim();
}

function uniqueSorted(values) {
  return [...new Set(values.filter(Boolean))]
    .sort((a, b) => a.localeCompare(b));
}

function buildMainGroups() {
  const groups = uniqueSorted(menuItems.map(x => x.mainGroup));

  mainGroups.innerHTML = "";

  mainGroups.appendChild(
    createFilterButton("ALL", "All", selectedMainGroup === "ALL", () => {
      selectedMainGroup = "ALL";
      selectedSubgroup = "ALL";
      buildMainGroups();
      buildSubgroups();
      renderMenu();
    })
  );

  groups.forEach(group => {
    mainGroups.appendChild(
      createFilterButton(group, group, selectedMainGroup === group, () => {
        selectedMainGroup = group;
        selectedSubgroup = "ALL";
        buildMainGroups();
        buildSubgroups();
        renderMenu();
      })
    );
  });

  buildSubgroups();
}

function buildSubgroups() {
  let source = menuItems;

  if (selectedMainGroup !== "ALL") {
    source = source.filter(x => x.mainGroup === selectedMainGroup);
  }

  const groups = uniqueSorted(source.map(x => x.subgroup));

  subgroups.innerHTML = "";

  if (!groups.length) return;

  subgroups.appendChild(
    createFilterButton("ALL", "All subgroups", selectedSubgroup === "ALL", () => {
      selectedSubgroup = "ALL";
      buildSubgroups();
      renderMenu();
    }, true)
  );

  groups.forEach(group => {
    subgroups.appendChild(
      createFilterButton(group, group, selectedSubgroup === group, () => {
        selectedSubgroup = group;
        buildSubgroups();
        renderMenu();
      }, true)
    );
  });
}

function createFilterButton(value, label, active, action, secondary = false) {
  const button = document.createElement("button");
  button.className = "filter-button" + (active ? " active" : "");
  button.textContent = label;
  button.type = "button";
  button.addEventListener("click", action);
  return button;
}

function getFilteredItems() {
  return menuItems.filter(item => {
    const mainMatch =
      selectedMainGroup === "ALL" ||
      item.mainGroup === selectedMainGroup;

    const subgroupMatch =
      selectedSubgroup === "ALL" ||
      item.subgroup === selectedSubgroup;

    const searchable = [
      item.mainGroup,
      item.subgroup,
      item.item,
      item.description,
      item.tag
    ].join(" ").toLowerCase();

    const searchMatch =
      !searchText || searchable.includes(searchText);

    return mainMatch && subgroupMatch && searchMatch;
  });
}

function renderMenu() {
  const filtered = getFilteredItems();

  menuGrid.innerHTML = "";

  if (!filtered.length) {
    emptyState.classList.remove("hidden");
    statusEl.textContent = "0 items found";
    return;
  }

  emptyState.classList.add("hidden");
  statusEl.textContent =
    `${filtered.length} item${filtered.length === 1 ? "" : "s"} found`;

  filtered.forEach(item => {
    menuGrid.appendChild(createCard(item));
  });
}

function createCard(item) {
  const card = document.createElement("article");
  card.className = "menu-card";

  const imageWrap = document.createElement("div");
  imageWrap.className = "card-image";

  if (item.image) {
    const img = document.createElement("img");
    img.src = item.image;
    img.alt = item.item;
    img.loading = "lazy";
    img.onerror = () => {
      img.remove();
      addNoImage(imageWrap);
    };
    imageWrap.appendChild(img);
  } else {
    addNoImage(imageWrap);
  }

  if (item.tag) {
    const tag = document.createElement("span");
    tag.className = "tag";
    tag.textContent = item.tag;
    imageWrap.appendChild(tag);
  }

  const content = document.createElement("div");
  content.className = "card-content";

  const group = document.createElement("div");
  group.className = "card-group";
  group.textContent = [item.mainGroup, item.subgroup]
    .filter(Boolean)
    .join(" • ");

  const title = document.createElement("h3");
  title.textContent = item.item || "Menu Item";

  const description = document.createElement("p");
  description.textContent = item.description || "Tap to view this item.";

  const bottom = document.createElement("div");
  bottom.className = "card-bottom";

  const price = document.createElement("div");
  price.className = "price";
  price.textContent = formatPrice(item.price);

  const view = document.createElement("div");
  view.className = "view-label";
  view.textContent = "VIEW";

  bottom.append(price, view);
  content.append(group, title, description, bottom);
  card.append(imageWrap, content);

  card.addEventListener("click", () => openPreview(item));

  return card;
}

function addNoImage(parent) {
  const placeholder = document.createElement("div");
  placeholder.className = "no-image";
  placeholder.textContent = "🍽️";
  parent.appendChild(placeholder);
}

function formatPrice(value) {
  if (value === "" || value === null || value === undefined) {
    return "Price on request";
  }

  const number = Number(String(value).replace(/,/g, ""));

  if (!Number.isNaN(number)) {
    return "KSh " + number.toLocaleString("en-KE");
  }

  return "KSh " + value;
}

function openPreview(item) {
  const modal = document.getElementById("previewModal");
  const image = document.getElementById("modalImage");
  const noImage = document.getElementById("modalNoImage");
  const tag = document.getElementById("modalTag");

  document.getElementById("modalItem").textContent = item.item || "Menu Item";
  document.getElementById("modalGroup").textContent =
    [item.mainGroup, item.subgroup].filter(Boolean).join(" • ");
  document.getElementById("modalPrice").textContent = formatPrice(item.price);
  document.getElementById("modalDescription").textContent =
    item.description || "A delicious choice from Pecking Lounge.";

  if (item.tag) {
    tag.textContent = item.tag;
    tag.classList.remove("hidden");
  } else {
    tag.classList.add("hidden");
  }

  if (item.image) {
    image.src = item.image;
    image.alt = item.item || "Menu item";
    image.classList.remove("hidden");
    noImage.classList.add("hidden");

    image.onerror = () => {
      image.classList.add("hidden");
      noImage.classList.remove("hidden");
    };
  } else {
    image.classList.add("hidden");
    noImage.classList.remove("hidden");
  }

  modal.classList.remove("hidden");
  modal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}

function closePreview() {
  const modal = document.getElementById("previewModal");
  modal.classList.add("hidden");
  modal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

document.getElementById("modalClose").addEventListener("click", closePreview);
document.getElementById("modalBackdrop").addEventListener("click", closePreview);

document.addEventListener("keydown", event => {
  if (event.key === "Escape") closePreview();
});

function resetAllFilters() {
  selectedMainGroup = "ALL";
  selectedSubgroup = "ALL";
  searchText = "";
  searchInput.value = "";
  clearSearch.style.display = "none";
  buildMainGroups();
  renderMenu();
}

loadMenu();

const backToTop = document.getElementById("backToTop");

// Show button after scrolling down
window.addEventListener("scroll", () => {
    if (window.scrollY > 300) {
        backToTop.classList.add("show");
    } else {
        backToTop.classList.remove("show");
    }
});

// Scroll smoothly to the top
backToTop.addEventListener("click", () => {
    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
});