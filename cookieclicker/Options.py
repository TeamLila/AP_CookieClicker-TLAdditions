import typing
from dataclasses import dataclass
from Options import Choice, Option, Toggle, DefaultOnToggle, Range, OptionList, DeathLink, PerGameCommonOptions

class Goal(Range):
    """Achievement Goal
        100 is pretty easy, 300 is average and 500 is very hard.
        Achievement count include shadow achievements"""
    display_name = "Achievement Goal"
    range_start = 1
    range_end = 643 # Note: there are fewer locations than achievements, but the goal is checked on *achievements* client-side
    default = 100

class Traps(Range):
    """Traps Percentage"""
    display_name = "Traps Percentage"
    range_start = 0
    range_end = 100
    default = 50

class ProductionMultiplier(Range):
    """Production multiplier, as a power of ten
        0 (x1): Vanilla
        1/2 (x10/x100): Slightly faster early game
        3 (x1000): Suitable for sync (completion in several hours)
        4 (x10.000): Suitable for sync (completion in about 1 hour)
        5 (x100.000): You can stop now.
    """
    display_name = "Production Multiplier (power of ten)"
    range_start = 0
    range_end = 5
    default = 0

class LumpMultiplier(Range):
    """Lump multiplier"""
    display_name = "Lump Multiplier"
    range_start = 1
    range_end = 10
    default = 1

class EnableAutoHints(Toggle):
    """Enable revealing the items in adjacent locations when completing an achievement"""
    display_name = "Enable Auto Hints"

class SynergyAsProgressiveBuildings(Toggle):
    """When enabled, this option makes Synergy upgrades behave like an Unlock Building item.
        This mean you get 3x Unlock Building instead of 1x, and subsequent unlocks will
        turn into a synergy upgrade instead.
    """
    display_name = "Synergy as Progressive Buildings"

class PlentifulBuildings(Range):
    """Add additional copies of the Buildings into the item pool, allowing you to more easily find and unlock them
    Stacks with Progressive Buildings"""
    display_name = "Plentiful buildings"
    rage_start = 0
    range_end = 5
    default = 1


@dataclass
class CCOptions(PerGameCommonOptions):
    advancement_goal: Goal
    traps_percentage: Traps
    enable_hints: EnableAutoHints
    production_multiplier: ProductionMultiplier
    lump_multiplier: LumpMultiplier
    enable_progressive_buildings: SynergyAsProgressiveBuildings
    plentiful_buildings: PlentifulBuildings
