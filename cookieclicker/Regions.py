from BaseClasses import Region, ItemClassification

from .Locations import (SPHERE, CCLocation, locations)
from .Rules import RULES
from .Items import CCItem


def create_regions(world: "CookieClicker "):
    multiworld = world.multiworld
    player = world.player

    menu = Region("Menu", player, multiworld)
    multiworld.regions.append(menu)

    region = menu
    # Create region for each sphere, and then connect it to the previous sphere
    for sphere in SPHERE:
        if sphere == SPHERE.EXCLUDED:
            continue

        previous = region
        region = Region(sphere.name, player, multiworld)

        for location in locations["by_sphere"][sphere]:
            region.add_locations({ f"{location.name}":location.id}, CCLocation)

        if sphere == SPHERE.ENDGAME:
            # Special virtual item (event) to check victory. Think of it as a flag item
            event_location = CCLocation(player, "Victory location", 42000000, region)
            event_location.place_locked_item(CCItem("Victory", ItemClassification.progression, 42000000, player))
            region.locations.append(event_location)

        sphere_rules = RULES[sphere]
        if sphere == SPHERE.GRANDMAPO:
            menu.connect(region, rule=sphere_rules)
        else:
            previous.connect(region, rule=sphere_rules)
        multiworld.regions.append(region)
