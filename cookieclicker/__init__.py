import random
from dataclasses import asdict
from BaseClasses import Item
from worlds.AutoWorld import World
from .Items import CCItem, traps, item_table, upgrades, structures, can_become_progressive, cookie_multiplier, \
    cookie_multiplier_weights, progressive_structures, progressive_heavens
from .Locations import CCLocation, locations, SPHERE
from .Options import CCOptions
from .Rules import set_rules
from .Regions import create_regions

class CookieClicker(World):
    game = "Cookie Clicker"
    worldversion = "0.8.0"
    location_name_to_id = locations["name_to_id"]
    options_dataclass = CCOptions
    options: CCOptions
    item_name_to_id = { name: data.code for name, data in item_table.items() }
    cookie_names = [ item.item_name for item in cookie_multiplier ]
    cookie_weights = [ cookie_multiplier_weights.get(item.item_name, 1) for item in cookie_multiplier ]
    start_inventory = {}
    trashitems = 0

    print("ℹ️🍪 This Cookie Clicker apworld does not include a manifest file, and will not until this issue is resolved > https://github.com/ArchipelagoMW/Archipelago/issues/5585")


    def create_regions(self):
        create_regions(self)

    def create_item(self, name: str) -> CCItem:
        item_data = item_table.get(name)
        if item_data is None:
            raise Exception(f"Tried to create unknown item: {name}")
        return CCItem(name, item_data.classification, item_data.code, self.player)

    def create_items(self):
        for upgrade in upgrades:
            self.multiworld.itempool.append(self.create_item(upgrade.item_name))

        placed_structures = 0
        if self.options.enable_progressive_buildings.value:
            # We skipp all the others and use progressive structures instead
            for progressive_structure_unlock in progressive_structures:

                # Loops once per extra copy and 3 base times
                for _ in range(self.options.plentiful_buildings + 3):
                    progressive_item = self.create_item(progressive_structure_unlock.item_name)
                    self.multiworld.itempool.append(progressive_item)
                    placed_structures += 1

        else:
            for structure_unlock in structures:
                for _ in range(self.options.plentiful_buildings + 1):
                    self.multiworld.itempool.append(self.create_item(structure_unlock.item_name))
                    placed_structures += 1
    
            for item in can_become_progressive:
                self.multiworld.itempool.append(self.create_item(item.item_name))
                placed_structures += 1


        # Very ugly code
        for _ in range(5):
            self.multiworld.itempool.append(self.create_item(progressive_heavens.item_name))
            placed_structures += 1

        total_locations = len(self.multiworld.get_unfilled_locations(self.player)) #Note To Charlignon: This is called unfilled locations for a reason, this num already includes the placed Unlocks (leading to More often than not (especialy with a lot of duplicate building unlocks) for the gen to fail)
        placed_items_count = len(upgrades)
        remaining_locations = total_locations - placed_items_count

        if remaining_locations < 0:
            raise Exception(f"More upgrades and structures than locations! (missing {remaining_locations*-1} locations)")

        trap_percent = self.options.traps_percentage.value / 100.0
        trap_count = int(remaining_locations * trap_percent)
        filler_count = remaining_locations - trap_count

        trap_names = [item.item_name for item in traps]
        for _ in range(trap_count):
            trap_name = random.choice(trap_names)
            self.multiworld.itempool.append(self.create_item(trap_name))

        for _ in range(filler_count):
            name = random.choices(self.cookie_names, weights = self.cookie_weights, k = 1)[0]
            self.multiworld.itempool.append(self.create_item(name))

    # We got some games which leave some locations unfilled, so we need to fill them with some filler items
    def pre_fill(self):
        pass

    def create_filler(self) -> Item:
        name = random.choices(self.cookie_names, weights = self.cookie_weights, k = 1)[0]
        return self.create_item(name)

    def fill_slot_data(self) -> dict:
        return {
            "player_name": self.multiworld.get_player_name(self.player),
            "player_id": self.player,
            "race": self.multiworld.is_race
        } | {k: v.value for k, v in asdict(self.options).items()}

    set_rules = set_rules
