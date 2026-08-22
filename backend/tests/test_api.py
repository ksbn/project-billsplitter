"""
Full test suite for BillSplitter API.
Uses an in-memory SQLite database — no Postgres required to run tests.
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.database import Base, get_db

# ── In-memory SQLite for tests ────────────────────────────
SQLITE_URL = "sqlite:///./test.db"
engine = create_engine(SQLITE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db


@pytest.fixture(autouse=True)
def reset_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def client():
    return TestClient(app)


# ── Helpers ───────────────────────────────────────────────
def create_group(client, name="Test Dinner", tip=10.0):
    r = client.post("/api/groups/", json={"name": name, "tip_percentage": tip})
    assert r.status_code == 201
    return r.json()


def add_member(client, owner_token, name="Alice"):
    r = client.post(
        "/api/members/",
        params={"owner_token": owner_token},
        json={"name": name},
    )
    assert r.status_code == 201
    return r.json()


def add_item(client, owner_token, name="Pizza", price=12.0):
    r = client.post(
        "/api/menu-items/",
        params={"owner_token": owner_token},
        json={"name": name, "price": price},
    )
    assert r.status_code == 201
    return r.json()


# ═══════════════════════════════════════════════════════════
# GROUP TESTS
# ═══════════════════════════════════════════════════════════

class TestGroupCreate:
    def test_create_group_returns_201(self, client):
        r = client.post("/api/groups/", json={"name": "Mario's Dinner", "tip_percentage": 15})
        assert r.status_code == 201
        data = r.json()
        assert data["name"] == "Mario's Dinner"
        assert data["tip_percentage"] == 15
        assert data["is_closed"] is False
        assert "owner_token" in data

    def test_create_group_default_tip_zero(self, client):
        r = client.post("/api/groups/", json={"name": "Lunch"})
        assert r.json()["tip_percentage"] == 0.0

    def test_owner_token_is_unique(self, client):
        g1 = create_group(client, "Group A")
        g2 = create_group(client, "Group B")
        assert g1["owner_token"] != g2["owner_token"]


class TestGroupFetch:
    def test_get_group_by_owner_token(self, client):
        g = create_group(client)
        r = client.get(f"/api/groups/owner/{g['owner_token']}")
        assert r.status_code == 200
        assert r.json()["name"] == g["name"]

    def test_owner_token_not_found_returns_404(self, client):
        r = client.get("/api/groups/owner/nonexistent")
        assert r.status_code == 404

    def test_get_group_by_join_token(self, client):
        g = create_group(client)
        m = add_member(client, g["owner_token"], "Bob")
        r = client.get(f"/api/groups/join/{m['join_token']}")
        assert r.status_code == 200
        assert r.json()["name"] == g["name"]
        # Public view must NOT expose owner_token
        assert "owner_token" not in r.json()


class TestGroupUpdate:
    def test_update_tip(self, client):
        g = create_group(client, tip=0)
        r = client.patch(
            f"/api/groups/owner/{g['owner_token']}/tip",
            params={"tip_percentage": 20},
        )
        assert r.status_code == 200
        assert r.json()["tip_percentage"] == 20

    def test_close_group(self, client):
        g = create_group(client)
        r = client.patch(f"/api/groups/owner/{g['owner_token']}/close")
        assert r.status_code == 200
        assert r.json()["is_closed"] is True


# ═══════════════════════════════════════════════════════════
# MEMBER TESTS
# ═══════════════════════════════════════════════════════════

class TestMembers:
    def test_add_member(self, client):
        g = create_group(client)
        m = add_member(client, g["owner_token"], "Carol")
        assert m["name"] == "Carol"
        assert "join_token" in m

    def test_join_tokens_are_unique(self, client):
        g = create_group(client)
        m1 = add_member(client, g["owner_token"], "Alice")
        m2 = add_member(client, g["owner_token"], "Bob")
        assert m1["join_token"] != m2["join_token"]

    def test_cannot_add_member_to_closed_group(self, client):
        g = create_group(client)
        client.patch(f"/api/groups/owner/{g['owner_token']}/close")
        r = client.post(
            "/api/members/",
            params={"owner_token": g["owner_token"]},
            json={"name": "Late Guest"},
        )
        assert r.status_code == 400

    def test_get_member_by_join_token(self, client):
        g = create_group(client)
        m = add_member(client, g["owner_token"], "Dave")
        r = client.get(f"/api/members/join/{m['join_token']}")
        assert r.status_code == 200
        assert r.json()["name"] == "Dave"

    def test_invalid_join_token_returns_404(self, client):
        r = client.get("/api/members/join/badtoken")
        assert r.status_code == 404


# ═══════════════════════════════════════════════════════════
# MENU ITEM TESTS
# ═══════════════════════════════════════════════════════════

class TestMenuItems:
    def test_add_menu_item(self, client):
        g = create_group(client)
        item = add_item(client, g["owner_token"], "Pasta", 14.50)
        assert item["name"] == "Pasta"
        assert item["price"] == 14.50

    def test_cannot_add_item_to_closed_group(self, client):
        g = create_group(client)
        client.patch(f"/api/groups/owner/{g['owner_token']}/close")
        r = client.post(
            "/api/menu-items/",
            params={"owner_token": g["owner_token"]},
            json={"name": "Dessert", "price": 8.0},
        )
        assert r.status_code == 400

    def test_delete_menu_item(self, client):
        g = create_group(client)
        item = add_item(client, g["owner_token"])
        r = client.delete(
            f"/api/menu-items/{item['id']}",
            params={"owner_token": g["owner_token"]},
        )
        assert r.status_code == 204


# ═══════════════════════════════════════════════════════════
# SELECTION TESTS
# ═══════════════════════════════════════════════════════════

class TestSelections:
    def _setup(self, client):
        g = create_group(client, tip=10)
        m = add_member(client, g["owner_token"], "Eve")
        item = add_item(client, g["owner_token"], "Steak", 25.0)
        return g, m, item

    def test_select_item(self, client):
        g, m, item = self._setup(client)
        r = client.post(
            "/api/selections/",
            params={"join_token": m["join_token"]},
            json={"menu_item_id": item["id"], "quantity": 1},
        )
        assert r.status_code == 201
        assert r.json()["quantity"] == 1

    def test_upsert_changes_quantity(self, client):
        g, m, item = self._setup(client)
        client.post(
            "/api/selections/",
            params={"join_token": m["join_token"]},
            json={"menu_item_id": item["id"], "quantity": 1},
        )
        r = client.post(
            "/api/selections/",
            params={"join_token": m["join_token"]},
            json={"menu_item_id": item["id"], "quantity": 2},
        )
        assert r.json()["quantity"] == 2

    def test_quantity_zero_removes_selection(self, client):
        g, m, item = self._setup(client)
        client.post(
            "/api/selections/",
            params={"join_token": m["join_token"]},
            json={"menu_item_id": item["id"], "quantity": 1},
        )
        r = client.post(
            "/api/selections/",
            params={"join_token": m["join_token"]},
            json={"menu_item_id": item["id"], "quantity": 0},
        )
        assert r.status_code == 201

    def test_cannot_select_item_from_different_group(self, client):
        g1 = create_group(client, "Group 1")
        g2 = create_group(client, "Group 2")
        m = add_member(client, g1["owner_token"], "Frank")
        item_g2 = add_item(client, g2["owner_token"], "Burger", 10.0)
        r = client.post(
            "/api/selections/",
            params={"join_token": m["join_token"]},
            json={"menu_item_id": item_g2["id"], "quantity": 1},
        )
        assert r.status_code == 404

    def test_get_my_selections(self, client):
        g, m, item = self._setup(client)
        client.post(
            "/api/selections/",
            params={"join_token": m["join_token"]},
            json={"menu_item_id": item["id"], "quantity": 2},
        )
        r = client.get(f"/api/selections/member/{m['join_token']}")
        assert r.status_code == 200
        assert len(r.json()) == 1
        assert r.json()[0]["quantity"] == 2


# ═══════════════════════════════════════════════════════════
# SUMMARY TESTS
# ═══════════════════════════════════════════════════════════

class TestSummary:
    def test_summary_calculates_correctly(self, client):
        g = create_group(client, tip=10)
        m = add_member(client, g["owner_token"], "Gina")
        item = add_item(client, g["owner_token"], "Salad", 20.0)

        client.post(
            "/api/selections/",
            params={"join_token": m["join_token"]},
            json={"menu_item_id": item["id"], "quantity": 2},
        )

        r = client.get(f"/api/groups/owner/{g['owner_token']}/summary")
        assert r.status_code == 200
        data = r.json()

        # Gina: 2 x $20 = $40 subtotal, $4 tip (10%), $44 total
        assert data["grand_total"] == 44.0
        assert len(data["members"]) == 1
        gina = data["members"][0]
        assert gina["subtotal"] == 40.0
        assert gina["tip_amount"] == 4.0
        assert gina["total"] == 44.0

    def test_summary_multiple_members(self, client):
        g = create_group(client, tip=0)
        alice = add_member(client, g["owner_token"], "Alice")
        bob = add_member(client, g["owner_token"], "Bob")
        pizza = add_item(client, g["owner_token"], "Pizza", 10.0)
        wine = add_item(client, g["owner_token"], "Wine", 15.0)

        client.post("/api/selections/", params={"join_token": alice["join_token"]},
                    json={"menu_item_id": pizza["id"], "quantity": 1})
        client.post("/api/selections/", params={"join_token": bob["join_token"]},
                    json={"menu_item_id": wine["id"], "quantity": 1})

        r = client.get(f"/api/groups/owner/{g['owner_token']}/summary")
        data = r.json()
        assert data["grand_total"] == 25.0

    def test_empty_group_summary(self, client):
        g = create_group(client)
        r = client.get(f"/api/groups/owner/{g['owner_token']}/summary")
        assert r.status_code == 200
        assert r.json()["grand_total"] == 0.0
        assert r.json()["members"] == []


# ═══════════════════════════════════════════════════════════
# HEALTH CHECK
# ═══════════════════════════════════════════════════════════

def test_health(client):
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"
