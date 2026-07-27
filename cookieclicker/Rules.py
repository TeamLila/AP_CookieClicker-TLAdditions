from enum import Enum

from worlds.generic.Rules import forbid_item
from rule_builder.rules import (Has, HasAny, HasAll, True_)
from .Locations import (SPHERE, BUILDING, locations, krumblorLocations)


class BUILDING_NAME(Enum):
    CURSOR = "Cursor"
    # GRANDMA = "Grandma"
    FARM = "Farm"
    MINE = "Mine"
    FACTORY = "Factory"
    BANK = "Bank"
    TEMPLE = "Temple"
    WIZARD_TOWER = "Wizard Tower"
    SHIPMENT = "Shipment"
    ALCHEMY_LAB = "Alchemy Lab"
    PORTAL = "Portal"
    TIME_MACHINE = "Time Machine"
    ANTIMATTER_CONDENSER = "Antimatter Condenser"
    PRISM = "Prism"
    CHANCEMAKER = "Chancemaker"
    FRACTAL_ENGINE = "Fractal Engine"
    JAVASCRIPT_CONSOLE = "Javascript Console"
    IDLEVERSE = "Idleverse"
    CORTEX_BAKER = "Cortex Baker"
    YOU = "You"

    def to_building_id(self):
        return BUILDING[self.name].value

    def unlock_item(self):
        return "Unlock " + self.value

    def progressive_item(self):
        return "Progressive " + self.value


def set_rules(world: "CookieClicker"):
    multiworld = world.multiworld
    player = world.player

    # 1) Prevent each “Unlock Building” item from ever appearing in any of that building’s own-achievement locations.
    for building in BUILDING_NAME:
        for location in locations['by_building'][BUILDING[building.name]]:
            cclocation = multiworld.get_location(location.name, player)
            world.set_rule(cclocation, HasAny(building.unlock_item(), building.progressive_item()))
            forbid_item(cclocation, building.unlock_item(), player)
            forbid_item(cclocation, building.progressive_item(), player)

    # 2) Standard completion check. Due to AP limitations, the achievement count check is done client-side
    #    and a special Victory item is unlocked if conditions are met
    world.multiworld.completion_condition[player] = lambda state: state.has("Victory", world.player)

    #Basic Crumblor Logic
    for checkNum, buildingEnum in enumerate(BUILDING_NAME, start=5):
        cclocation = multiworld.get_location(krumblorLocations[checkNum], player)
        world.set_rule(cclocation, HasAny(buildingEnum.unlock_item(), buildingEnum.progressive_item()))
        forbid_item(cclocation, building.unlock_item(), player)
        forbid_item(cclocation, building.progressive_item(), player)
    #Ensure that the game only considers lvl 3 in logic if lvl 2 is reachable etc.
    for i in range(1, len(krumblorLocations)):
        prev = world.get_location(krumblorLocations[i - 1])
        curr = world.get_location(krumblorLocations[i])

        world.set_rule(
            curr,
            lambda state, prev=prev: prev.access_rule(state)
        )


# Export rules applied to regions during create_regions()
RULES = {
    SPHERE.ZERO: True_(),
    SPHERE.ONE: HasAny(BUILDING_NAME.TEMPLE.unlock_item(), BUILDING_NAME.TEMPLE.progressive_item(),
                       BUILDING_NAME.WIZARD_TOWER.unlock_item(), BUILDING_NAME.WIZARD_TOWER.progressive_item())
                        & Has("A crumbly egg"),
    SPHERE.TWO: HasAny(BUILDING_NAME.ALCHEMY_LAB.unlock_item(), BUILDING_NAME.ALCHEMY_LAB.progressive_item(),
                       BUILDING_NAME.PORTAL.unlock_item(), BUILDING_NAME.PORTAL.progressive_item()),
    SPHERE.THREE: HasAny(BUILDING_NAME.FRACTAL_ENGINE.unlock_item(), BUILDING_NAME.FRACTAL_ENGINE.progressive_item()),
    SPHERE.FOUR: HasAny(BUILDING_NAME.IDLEVERSE.unlock_item(), BUILDING_NAME.IDLEVERSE.progressive_item()),
    SPHERE.FIVE: HasAny(BUILDING_NAME.CORTEX_BAKER.unlock_item(), BUILDING_NAME.CORTEX_BAKER.progressive_item()),
    SPHERE.LATEGAME: HasAny(BUILDING_NAME.YOU.unlock_item(), BUILDING_NAME.YOU.progressive_item()),
    SPHERE.ENDGAME: (HasAll(*[b.unlock_item() for b in BUILDING_NAME])
                     | HasAll(*[b.progressive_item() for b in BUILDING_NAME])),
    SPHERE.GRANDMAPO: HasAny("One Mind", "Communal brainsweep", "Elder Pact")
}
