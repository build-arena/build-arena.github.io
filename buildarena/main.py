#!/usr/bin/env python3
"""
Build Arena - Terminal Game

An interactive terminal-based game where you build machines freely.
"""

import os
import sys
from typing import Optional, List, Dict
import time
import inspect
from datetime import datetime

from rich.console import Console
from rich.panel import Panel
from rich.table import Table
from rich.prompt import Prompt, Confirm
from rich import box
from rich.text import Text

from besiege.build import Machine

# Use absolute path in user's home directory for saved machines
# This ensures it works correctly when packaged with PyInstaller
SavedMachines = os.path.join(os.path.expanduser('~'), 'BuildArena', 'SavedMachines')
ARXIV_URL = "https://arxiv.org/abs/2510.16559"
LAB_URL = "https://ai4s.lab.westlake.edu.cn/"
PROJECT_URL = "https://build-arena.github.io/"
CODE_URL = "https://github.com/AI4Science-WestlakeU/BuildArena"
BESIEGE_URL = "https://store.steampowered.com/app/346010/Besiege/"

console = Console()


# Group display configuration
GROUP_CONFIG = {
    "build_only": {"name": "🚀 Start", "emoji": "🚀"},
    "build": {"name": "🧱 Build", "emoji": "🧱"},
    "refine": {"name": "⚙️  Refine", "emoji": "⚙️"},
    "default": {"name": "ℹ️  Info", "emoji": "ℹ️"},
}

# Extra game operations not in Machine API
EXTRA_OPERATIONS = {
    "save": {"name": "💾 Save Machine", "group": "default"},
    "tutorial": {"name": "📖 Tutorial", "group": "default"},
    "view_blocks": {"name": "📋 List Current Blocks", "group": "default"},
    "view_available": {"name": "🔍 View Available Blocks", "group": "build"},
}


def check_expiration_date():
    """Check if the current date exceeds the expiration date."""
    expiration_date = datetime(2026, 11, 20)
    current_date = datetime.now()
    
    if current_date > expiration_date:
        console.clear()
        console.print("\n" * 3)
        
        error_panel = Panel(
            "[bold red]⚠️  Program Expired[/bold red]\n\n"
            "[white]This version of BuildArena has reached its expiration date.[/white]\n"
            f"[dim]Expiration Date: November 20, 2026[/dim]\n"
            f"[dim]Current Date: {current_date.strftime('%B %d, %Y')}[/dim]\n\n"
            "[yellow]Please contact the developer for an updated version.[/yellow]",
            border_style="red",
            padding=(1, 2)
        )
        
        console.print(error_panel, justify="center")
        console.print("\n")
        sys.exit(1)


def show_title():
    """Display the game title screen."""
    from rich.align import Align
    from rich.rule import Rule
    
    console.clear()
    
    # ASCII art title
    title = """
    ╔═════════════════════════════════════════════════════════╗
    ║                                                         ║
    ║          ██████╗ ██╗   ██╗██╗██╗     ██████╗            ║
    ║          ██╔══██╗██║   ██║██║██║     ██╔══██╗           ║
    ║          ██████╔╝██║   ██║██║██║     ██║  ██║           ║
    ║          ██╔══██╗██║   ██║██║██║     ██║  ██║           ║
    ║          ██████╔╝╚██████╔╝██║███████╗██████╔╝           ║
    ║          ╚═════╝  ╚═════╝ ╚═╝╚══════╝╚═════╝            ║
    ║                                                         ║
    ║        █████╗ ██████╗ ███████╗███╗   ██╗ █████╗         ║
    ║       ██╔══██╗██╔══██╗██╔════╝████╗  ██║██╔══██╗        ║
    ║       ███████║██████╔╝█████╗  ██╔██╗ ██║███████║        ║
    ║       ██╔══██║██╔══██╗██╔══╝  ██║╚██╗██║██╔══██║        ║
    ║       ██║  ██║██║  ██║███████╗██║ ╚████║██║  ██║        ║
    ║       ╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝╚═╝  ╚═══╝╚═╝  ╚═╝        ║
    ║                                                         ║
    ╚═════════════════════════════════════════════════════════╝
    """
    console.print(title, style="bold cyan", justify="center")
    
    # Header with subtitle
    # header_text = Text()
    # header_text.append("🧠 Build Like LLMs — If You Dare 🧠", style="bold magenta")
    # header_text.append("\n")
    # header_text.append("A Playful Language-Only Building Challenge for Humans", style="bright_black")
    
    # console.print(Panel(
    #     Align.center(header_text),
    #     border_style="bright_magenta",
    #     padding=(1, 4),
    #     box=box.HEAVY
    # ))
    console.print()
    
    # Welcome section
    welcome = Text.from_markup(
        "[bold]Greetings![/bold] Welcome to [bold cyan]BuildArena[/bold cyan]!\n\n"
        "A [bold cyan]Playful Game for Human Users[/bold cyan] — build your machines, block by block!"
    )
    console.print(Panel(welcome, title="🧠 Build Like LLMs — If You Dare 🧠", title_align="center", 
                       border_style="bright_cyan", padding=(1, 2), box=box.ROUNDED))
    console.print()
    
    # Inspiration section
    # besiege = Text.from_markup(
    #     f"Inspired by [bold cyan]Besiege[/bold cyan], a physics-based construction & simulation game:\n"
    #     f"[link={BESIEGE_URL}]{BESIEGE_URL}[/link]"
    # )
    # console.print(Panel(besiege, title="🧱 Inspiration", title_align="left",
    #                    border_style="bright_cyan", padding=(1, 2), box=box.ROUNDED))
    # console.print()
    
    # Research section
    origin = Text.from_markup(
        f"Inspired by [bold cyan]Besiege[/bold cyan], a physics-based construction & simulation game:\n"
        f"[link={BESIEGE_URL}]{BESIEGE_URL}[/link]\n\n"
        "[bold]Originated from Our Research:[/bold]\n\n"
        '[bold]"[cyan]BuildArena: A Physics-Aligned Interactive Benchmark of LLMs for Engineering Construction[/cyan]"[/bold]\n'
        f"[link={ARXIV_URL}]{ARXIV_URL}[/link]\n\n"
        "We are [bold magenta]AI for Scientific Simulation & Discovery Lab[/bold magenta] at "
        f"[bold cyan]Westlake University[/bold cyan] ([link={LAB_URL}]{LAB_URL}[/link])"
    )
    console.print(Panel(origin, title="📄 Credits & Research 📄", title_align="center",
                       border_style="bright_magenta", padding=(1, 2), box=box.DOUBLE))
    console.print()
    
    # Gameplay section
    gameplay = Text.from_markup(
        "[bold red]Extremely Challenging Game Experience[/bold red]\n\n"
        "Here, you play under exactly the same constraints as the LLMs:\n\n"
        "🚫 [bold red]No Visuals, No Clicks[/bold red] 🚫\n"
        "Just text commands, physics, and your own reasoning.\n"
        "Every block, must be placed through [bold red]LANGUAGE[/bold red] alone."
    )
    console.print(Panel(gameplay, title="🎮 How It Plays 🎮", title_align="center",
                       border_style="bright_cyan", padding=(1, 2), box=box.ROUNDED))
    console.print()
    
    # Results section
    results = Text.from_markup(
        "And yet… [bold bright_blue]Grok[/bold bright_blue], [bold bright_magenta]Seed[/bold bright_magenta], [bold bright_yellow]Claude[/bold bright_yellow], [bold bright_cyan]DeepSeek[/bold bright_cyan], [bold bright_green]GPT[/bold bright_green]…\n"
        "Trending LLMs still managed to build 🚗vehicles🚗, 🌉bridges🌉, and 🚀rockets🚀 🤯\n"
        f"Check out [bold magenta]Machines Built by LLMs[/bold magenta] on our [bold magenta]Project Page[/bold magenta]: [link={PROJECT_URL}]{PROJECT_URL}[/link]\n\n"
        "Think you can do better — [i]blindfolded[/i]? 😏\n\n"
        "[bold red]Try it. The LLMs already did.[/bold red]"
    )
    console.print(Panel(results, title="🏁 LLM Results & Your Challenge 🏁", title_align="center",
                       border_style="bright_magenta", padding=(1, 2), box=box.DOUBLE))
    console.print()
    
    input("\n[Press Enter to continue]")


def show_links():
    """Display quick links table."""
    from rich.rule import Rule
    
    console.print(Rule(style="bright_black"))
    console.print()
    
    table = Table(
        title="Quick Links",
        title_style="bold bright_cyan",
        show_header=True,
        header_style="bold bright_cyan",
        expand=False,
        box=box.SIMPLE_HEAVY
    )
    table.add_column("Item", no_wrap=True)
    table.add_column("URL", overflow="fold", ratio=2)
    
    table.add_row("Project Page", f"[link={PROJECT_URL}]{PROJECT_URL}[/link]")
    table.add_row("Paper Link", f"[link={ARXIV_URL}]{ARXIV_URL}[/link]")
    table.add_row("Lab Website", f"[link={LAB_URL}]{LAB_URL}[/link]")
    table.add_row("Code Repository", f"[link={CODE_URL}]{CODE_URL}[/link]")
    table.add_row("Game Website (Besiege)", f"[link={BESIEGE_URL}]{BESIEGE_URL}[/link]")
    
    console.print(Panel(table, border_style="bright_cyan", padding=(1, 2), box=box.DOUBLE))
    console.print()


def configure_savedmachines_path():
    """Configure the Besiege SavedMachines folder path."""
    global SavedMachines
    
    console.clear()
    
    # Create header
    console.print(Panel.fit(
        "[bold cyan]⚙️  CONFIGURE BESIEGE SAVEDMACHINES PATH[/bold cyan]",
        border_style="cyan",
        box=box.DOUBLE
    ))
    console.print()
    
    # Display information about the path
    info = Text()
    info.append("About SavedMachines Path:\n\n", style="bold yellow")
    info.append("The Besiege game SavedMachines folder is typically located at:\n", style="dim")
    info.append("  • Windows: ", style="cyan")
    info.append("C:\\Program Files (x86)\\Steam\\steamapps\\common\\Besiege\\Besiege_Data\\SavedMachines\n", style="white")
    info.append("  • macOS: ", style="cyan")
    info.append("~/Library/Application Support/Steam/steamapps/common/Besiege/Besiege.app/Contents/SavedMachines\n", style="white")
    info.append("  • Linux: ", style="cyan")
    info.append("~/.steam/steam/steamapps/common/Besiege/Besiege_Data/SavedMachines\n\n", style="white")
    
    info.append("💡 If you provide this path:\n", style="bold yellow")
    info.append("   → Your machines will be saved directly to the game folder\n", style="green")
    info.append("   → You can open them immediately in Besiege without manual copying\n\n", style="green")
    
    info.append(f"📁 If you leave it as default (~{os.path.join('', 'BuildArena', 'SavedMachines')}):\n", style="bold yellow")
    info.append("   → Machines will be saved to your home directory\n", style="yellow")
    info.append("   → You'll need to manually copy .bsg files to Besiege to use them\n", style="yellow")
    
    console.print(Panel(info, border_style="cyan", padding=(1, 2)))
    console.print()
    
    # Show current path
    console.print(f"[bold]Current path:[/bold] [cyan]{SavedMachines}[/cyan]\n")
    
    # Ask if user wants to change
    if not Confirm.ask("[bold]Do you want to change the SavedMachines path?[/bold]", default=False):
        return
    
    # Get new path from user
    console.print("\n[dim]Enter the full path to your Besiege SavedMachines folder:[/dim]")
    console.print("[dim]Or press Enter to keep the current path[/dim]\n")
    
    new_path = Prompt.ask("[bold]Enter path[/bold]", default=SavedMachines)
    
    # Expand user path (e.g., ~ to home directory)
    new_path = os.path.expanduser(new_path)
    
    # Check if path exists
    if not os.path.exists(new_path):
        console.print(f"\n[yellow]⚠️  Path does not exist: {new_path}[/yellow]")
        if Confirm.ask("[bold]Create this directory?[/bold]", default=True):
            try:
                os.makedirs(new_path, exist_ok=True)
                console.print(f"[green]✓ Directory created: {new_path}[/green]")
            except Exception as e:
                console.print(f"[red]✗ Failed to create directory: {e}[/red]")
                input("\n[Press Enter to continue]")
                return
        else:
            console.print("[yellow]Path not changed.[/yellow]")
            input("\n[Press Enter to continue]")
            return
    
    # Update the path
    SavedMachines = new_path
    console.print(f"\n[green]✓ SavedMachines path updated to: {SavedMachines}[/green]")
    
    input("\n[Press Enter to continue]")


def show_main_menu() -> str:
    """Display main menu and get player choice."""
    global SavedMachines
    
    console.clear()
    
    # Create header
    console.print(Panel.fit(
        "[bold cyan]BUILD ARENA - MAIN MENU[/bold cyan]",
        border_style="cyan"
    ))
    
    console.print()
    
    # Show current SavedMachines path
    current_path = Text()
    current_path.append("Current Save Location: ", style="dim")
    current_path.append(SavedMachines, style="cyan")
    console.print(current_path)
    console.print()
    
    # Menu options
    menu_table = Table(show_header=False, box=box.ROUNDED, border_style="blue")
    menu_table.add_column("Option", style="cyan", width=4)
    menu_table.add_column("Description", style="white")
    
    menu_table.add_row("1", "🛠️  Start Building")
    menu_table.add_row("2", "📖 View Tutorial")
    menu_table.add_row("3", "⚙️  Configure Besiege SavedMachines Path")
    menu_table.add_row("4", "❌ Exit Game")
    
    console.print(menu_table)
    
    choice = Prompt.ask("\n[bold]Choose an option[/bold]", choices=["1", "2", "3", "4"])
    return choice


def get_operation_groups(machine: Machine) -> Dict[str, List]:
    """Get organized operation groups from machine.tools and extra operations."""
    groups = {}
    
    # Add machine tools
    for group_name, tools in machine.tools.items():
        if group_name in GROUP_CONFIG:
            groups[group_name] = tools.copy()
    
    # Add extra operations to appropriate groups
    for op_name, op_info in EXTRA_OPERATIONS.items():
        group = op_info["group"]
        if group not in groups:
            groups[group] = []
        groups[group].append({"name": op_name, "display_name": op_info["name"], "is_extra": True})
    
    return groups


def show_operation_groups(machine: Machine):
    """Display operation groups for selection."""
    console.clear()
    
    # Header with machine info
    if machine and machine.started:
        machine.update_prompt(complete=False, return_summary=True)
        # header_text = f"[bold cyan]{machine.name}[/bold cyan] | Blocks: {machine.num_blocks}"
        header_text = f"{machine.prompt}"
    else:
        header_text = "[bold cyan]New Machine[/bold cyan] | [yellow]Not started yet[/yellow]"
    
    console.print(Panel.fit(header_text, border_style="cyan"))
    console.print()
    
    # Get available groups
    groups = get_operation_groups(machine)
    
    # Display operation groups
    console.print("[bold]SELECT OPERATION GROUP:[/bold]\n")
    
    group_list = list(groups.keys())
    for i, group_name in enumerate(group_list, 1):
        display_name = GROUP_CONFIG.get(group_name, {}).get("name", group_name)
        console.print(f"[cyan]{i}[/cyan]. {display_name}")
    
    console.print(f"[cyan]0[/cyan]. 🔙 Return to Main Menu")
    
    choices = [str(i) for i in range(len(group_list) + 1)]
    choice = Prompt.ask("\n[bold]Choose a group[/bold]", choices=choices)
    
    if choice == "0":
        return None
    
    return group_list[int(choice) - 1]


def show_operations(machine: Machine, group_name: str):
    """Display operations within a selected group."""
    console.clear()
    
    display_name = GROUP_CONFIG.get(group_name, {}).get("name", group_name)
    console.print(Panel.fit(f"[bold cyan]{display_name}[/bold cyan]", border_style="cyan"))
    console.print()
    
    # Get operations for this group
    groups = get_operation_groups(machine)
    operations = groups.get(group_name, [])
    
    # Display operations
    console.print("[bold]SELECT OPERATION:[/bold]\n")
    
    for i, op in enumerate(operations, 1):
        # Handle both function objects and extra operation dicts
        if isinstance(op, dict) and op.get("is_extra"):
            op_name = op["display_name"]
        else:
            # It's a function from machine.tools
            op_name = op.__name__.replace("_", " ").title()
        
        console.print(f"[cyan]{i}[/cyan]. {op_name}")
    
    console.print(f"[cyan]0[/cyan]. 🔙 Back to Groups")
    
    choices = [str(i) for i in range(len(operations) + 1)]
    choice = Prompt.ask("\n[bold]Choose an operation[/bold]", choices=choices)
    
    if choice == "0":
        return None
    
    return operations[int(choice) - 1]


def prompt_for_parameter(param_name: str, param_type, machine: Machine):
    """Interactively prompt user for a parameter value based on its name and type."""
    # Handle block_id parameters
    if 'block' in param_name and 'id' in param_name:
        if not machine.started or len(machine.blocks) == 0:
            return None
        console.print("\n[bold]Current Blocks:[/bold]")
        for block_id, block in machine.blocks.items():
            console.print(f"  [cyan]{block_id}:[/cyan] {block.name}")
        value = Prompt.ask(f"\n[bold]Enter {param_name.replace('_', ' ')}[/bold]")
        return int(value) if value.isdigit() else value
    
    # Handle face parameters
    elif 'face' in param_name:
        console.print("\n[bold]Available Faces:[/bold]")
        console.print("  [dim]Face labels in capital letters[/dim]")
        face = Prompt.ask(f"\n[bold]Enter {param_name}[/bold]").upper()
        return face
    
    # Handle block name (for attach)
    elif param_name == 'new_block':
        from besiege.build import AvailableBlocks
        console.print("\n[bold]Available Block Types:[/bold]")
        for i, block_name in enumerate(AvailableBlocks, 1):
            console.print(f"  [cyan]{i}[/cyan]. {block_name}")
        choices = [str(i) for i in range(1, len(AvailableBlocks) + 1)]
        choice = Prompt.ask("\n[bold]Select block number[/bold]", choices=choices)
        return AvailableBlocks[int(choice) - 1]
    
    # Handle connector type
    elif param_name == 'connector':
        from besiege.build import AvailableConnectors
        console.print("\n[bold]Available Connectors:[/bold]")
        for i, connector_name in enumerate(AvailableConnectors, 1):
            console.print(f"  [cyan]{i}[/cyan]. {connector_name}")
        choices = [str(i) for i in range(1, len(AvailableConnectors) + 1)]
        choice = Prompt.ask("\n[bold]Select connector number[/bold]", choices=choices)
        return AvailableConnectors[int(choice) - 1]
    
    # Handle angle
    elif param_name == 'angle':
        console.print("\n[dim]Rotation angle in degrees (0-360)[/dim]")
        console.print("[dim]Common: 0, 45, 90, 180, 270[/dim]")
        value = Prompt.ask(f"[bold]Enter {param_name}[/bold]")
        return float(value)
    
    # Handle lists (shift, rotation, etc.)
    elif param_type == List or 'list' in str(param_type).lower():
        console.print(f"\n[dim]Enter {param_name} as comma-separated values (e.g., 0,0,0)[/dim]")
        value = Prompt.ask(f"[bold]Enter {param_name}[/bold]", default="0,0,0")
        return [float(x.strip()) for x in value.split(',')]
    
    # Handle note/description strings
    elif param_name == 'note':
        return Prompt.ask(f"\n[bold]Enter {param_name} (optional)[/bold]", default="")
    
    # Generic handling
    else:
        value = Prompt.ask(f"\n[bold]Enter {param_name}[/bold]")
        # Try to infer type
        if param_type == int or 'int' in str(param_type):
            return int(value)
        elif param_type == float or 'float' in str(param_type):
            return float(value)
        return value


def execute_operation(machine: Machine, operation) -> Optional[str]:
    """Execute a selected operation with interactive prompts."""
    try:
        # Handle extra operations
        if isinstance(operation, dict) and operation.get("is_extra"):
            op_name = operation["name"]
            
            if op_name == "save":
                if not machine.started:
                    return "[yellow]Nothing to save yet. Start a machine first![/yellow]"
                save_dir = os.path.join(SavedMachines, machine.name)
                os.makedirs(save_dir, exist_ok=True)
                machine.to_file(output_dir=save_dir)
                result = f"[green]✓ Machine saved to {save_dir}[/green]\n\n"
                result += "[bold cyan]📁 Saved Files:[/bold cyan]\n"
                result += f"[white]• [bold]{machine.name}.bsg[/bold] - Besiege game file, place in SavedMachines folder to open in game[/white]\n"
                result += f"[white]• [bold]{machine.name}.json[/bold] - Successful build steps only, for reconstruction and validation[/white]\n"
                result += f"[white]• [bold]{machine.name}_full.json[/bold] - Complete build history including failed attempts[/white]"
                return result
            
            elif op_name == "tutorial":
                show_tutorial()
                return None
            
            elif op_name == "view_blocks":
                if not machine.started or len(machine.blocks) == 0:
                    return "[yellow]No blocks yet. Start a machine first![/yellow]"
                result = "\n[bold]CURRENT BLOCKS:[/bold]\n\n"
                for block_id, block in machine.blocks.items():
                    result += f"[cyan]ID {block_id}:[/cyan] {block.name}\n"
                    result += f"  Position: {block.center_pos.coordinates}\n"
                    if hasattr(block, 'spin_direction'):
                        result += f"  Spin: {block.spin_direction}\n"
                    result += "\n"
                return result
            
            elif op_name == "view_available":
                return machine.blocks_storage()
        
        # Handle machine API operations
        else:
            func = operation
            func_name = func.__name__
            
            # Show function docstring as guidance
            if func.__doc__:
                console.print(f"\n[dim]{func.__doc__.strip()}[/dim]\n")
            
            # Special handling for start
            if func_name == "start":
                if machine.started:
                    return "[yellow]Machine already started![/yellow]"
                result = func()
                return result
            
            # Special handling for flip_spin - only show blocks with spin
            elif func_name == "flip_spin":
                spinful = [(bid, b) for bid, b in machine.blocks.items() if hasattr(b, 'spin_direction')]
                if not spinful:
                    return "[yellow]No blocks with spin direction found (like wheels).[/yellow]"
            
            # Get function signature
            sig = inspect.signature(func)
            params = {}
            
            # Prompt for each parameter
            for param_name, param in sig.parameters.items():
                if param_name == 'self':
                    continue
                    
                # Skip parameters with defaults if user wants
                if param.default != inspect.Parameter.empty:
                    if not Confirm.ask(f"Set {param_name}? (optional)", default=False):
                        continue
                
                # Prompt for value
                value = prompt_for_parameter(param_name, param.annotation, machine)
                if value is not None:
                    params[param_name] = value
            
            # Call the function
            result = func(**params)
            return result
    
    except Exception as e:
        return f"[red]Error: {e}[/red]"


def show_block_details():
    """Display detailed information about available blocks."""
    from besiege.build import all_blocks, AvailableBlocks, AvailableConnectors
    
    console.clear()
    console.print(Panel.fit(
        "[bold cyan]📦 BLOCK DETAILS[/bold cyan]",
        border_style="cyan"
    ))
    console.print()
    
    # Combine all available blocks and connectors
    all_available = AvailableBlocks + AvailableConnectors
    
    console.print("[bold]Select a block to view details:[/bold]\n")
    
    for i, block_name in enumerate(all_available, 1):
        console.print(f"  [cyan]{i}[/cyan]. {block_name}")
    
    console.print(f"  [cyan]0[/cyan]. 🔙 Back to Tutorial")
    
    choices = [str(i) for i in range(len(all_available) + 1)]
    choice = Prompt.ask("\n[bold]Choose a block[/bold]", choices=choices)
    
    if choice == "0":
        return
    
    # Display block details
    selected_block = all_available[int(choice) - 1]
    block_data = all_blocks[selected_block]
    
    console.clear()
    
    # Create detailed panel
    details = []
    details.append(f"[bold cyan]{block_data['name']}[/bold cyan]\n")
    details.append(f"[bold cyan]Type:[/bold cyan] {block_data['type'].title()}")
    details.append(f"[bold cyan]Shape:[/bold cyan] {block_data['shape']}")
    details.append(f"[bold cyan]Weight:[/bold cyan] {block_data['weight']} kg")
    details.append(f"[bold cyan]Cost:[/bold cyan] {block_data['cost']}")
    details.append(f"\n[bold cyan]Description:[/bold cyan]")
    details.append(f"{block_data['description']}")
    
    # Add locomotion info if available
    if block_data.get('locomotion'):
        details.append(f"\n[bold cyan]🎮 Controllable Actions:[/bold cyan]")
        for action in block_data['locomotion'].keys():
            details.append(f"[cyan]  •[/cyan] {action.replace('_', ' ').title()}")
    
    # Add wiki link
    if block_data.get('wiki'):
        details.append(f"\n[bold cyan]Wiki:[/bold cyan] [link={block_data['wiki']}]{block_data['wiki']}[/link]")
    
    console.print(Panel(
        "\n".join(details),
        title=f"📦 {block_data['name']}",
        title_align="left",
        border_style="cyan",
        padding=(1, 2)
    ))
    
    input("\n[Press Enter to continue]")
    show_block_details()  # Return to block list


def show_tutorial():
    """Show tutorial information."""
    console.clear()
    
    # Title
    console.print(Panel.fit(
        "[bold cyan]🎓 BUILD ARENA TUTORIAL[/bold cyan]",
        border_style="cyan",
        box=box.DOUBLE
    ))
    console.print()
    
    # Getting Started Section
    console.print("[bold bright_cyan]Getting Started[/bold bright_cyan]")
    console.print()
    console.print("[dim]BuildArena: a machine building game. You create machines by:[/dim]")
    console.print("  [cyan]1.[/cyan] Starting with a base block")
    console.print("  [cyan]2.[/cyan] Attaching blocks to build structures")
    console.print("  [cyan]3.[/cyan] Connecting parts with connectors")
    console.print("  [cyan]4.[/cyan] Adjusting orientation and properties")
    console.print()
    
    # Basic Operations Section
    console.print("[bold bright_cyan]Basic Operations[/bold bright_cyan]")
    console.print()
    
    # 1. Start Your Machine
    console.print("[bold yellow]1. Start Your Machine[/bold yellow]")
    console.print("   Start building process by creating a [bold]Starting Block[/bold] (ID 1)")
    console.print("   → Use the [bold cyan]Start[/bold cyan] operation to create the starting block")
    console.print()
    
    # 2. Attach Blocks
    console.print("[bold yellow]2. Attach Blocks[/bold yellow]")
    console.print("   Build the machine by attaching a new block to an attachable face")
    console.print("   → Use the [bold cyan]Attach Block To[/bold cyan] operation")
    console.print("   → Select: base block → face → new block type")
    console.print()
    
    # 3. Connect Blocks
    console.print("[bold yellow]3. Connect Blocks[/bold yellow]")
    console.print("   Add connectors to link two blocks together")
    console.print("   → Use the [bold cyan]Connect Blocks[/bold cyan] operation")
    console.print("   → Select: two blocks → two faces → connector type")
    console.print()
    
    # 4. Adjust & Refine
    console.print("[bold yellow]4. Adjust & Refine[/bold yellow]")
    console.print("   [green]•[/green] [bold]Twist[/bold]: Rotate a block by angle (0-360°) on its rooted face")
    console.print("   [green]•[/green] [bold]Shift[/bold]: Move a block by a vector offset")
    console.print("   [green]•[/green] [bold]Flip[/bold]: Reverse block spin direction")
    console.print()
    
    # 5. Info & Save
    console.print("[bold yellow]5. Info & Save[/bold yellow]")
    console.print("   [green]•[/green] [bold]Status[/bold]: View the current status of the machine")
    console.print("   [green]•[/green] [bold]Save[/bold]: Save your creation")
    console.print()
    
    # Tip Box
    tip = Text()
    tip.append("💡 Tip: ", style="bold yellow")
    tip.append("Select option ", style="dim")
    tip.append("[2]", style="bold cyan")
    tip.append(" below to view detailed descriptions of all available blocks!", style="dim")
    
    console.print(Panel(
        tip,
        border_style="yellow",
        padding=(0, 2),
        box=box.ROUNDED
    ))
    console.print()
    
    # Add menu options
    console.print("\n[bold]Tutorial Options:[/bold]\n")
    console.print("  [cyan]1[/cyan]. 🔙 Return to Main Menu")
    console.print("  [cyan]2[/cyan]. 📦 View Block Details")
    
    choice = Prompt.ask("\n[bold]Choose an option[/bold]", choices=["1", "2"])
    
    if choice == "2":
        show_block_details()
        show_tutorial()  # Return to tutorial after viewing blocks


def building_mode():
    """Interactive building mode with grouped operations."""
    console.clear()
    console.print(Panel.fit(
        "[bold cyan]🛠️  BUILDING MODE[/bold cyan]",
        border_style="cyan"
    ))
    
    console.print("\n[yellow]Welcome to Build Arena! Let's create your machines.[/yellow]\n")
    
    machine_name = Prompt.ask("[bold]Enter machine name[/bold]", default="my_machine")
    
    machine = Machine(name=machine_name, save_dir=SavedMachines)
    
    console.print(f"\n[green]✓ Building session started: {machine_name}[/green]")
    input("\n[Press Enter to continue]")
    
    # Main building loop
    while True:
        # Show operation groups
        group_name = show_operation_groups(machine)
        
        if group_name is None:
            # Return to main menu
            if machine.started:
                if Confirm.ask("\n[yellow]Do you want to save before exiting?[/yellow]"):
                    save_dir = os.path.join(SavedMachines, machine.name)
                    os.makedirs(save_dir, exist_ok=True)
                    machine.to_file(output_dir=save_dir)
                    console.print(f"[green]✓ Machine saved to {save_dir}![/green]\n")
                    console.print("[bold cyan]📁 Saved Files:[/bold cyan]")
                    console.print(f"[white]• [bold]{machine.name}.bsg[/bold] - Besiege game file, place in SavedMachines folder to open in game[/white]")
                    console.print(f"[white]• [bold]{machine.name}.json[/bold] - Successful build steps only, for reconstruction and validation[/white]")
                    console.print(f"[white]• [bold]{machine.name}_full.json[/bold] - Complete build history including failed attempts[/white]")
                    time.sleep(2)
            break
        
        # Show operations in selected group
        operation = show_operations(machine, group_name)
        
        if operation is None:
            # Back to groups
            continue
        
        # Execute selected operation
        result = execute_operation(machine, operation)
        
        if result:
            console.print(f"\n{result}")
            input("\n[Press Enter to continue]")


def main():
    """Main game loop."""
    # Check expiration date before starting
    check_expiration_date()
    
    show_title()
    
    while True:
        choice = show_main_menu()
        
        if choice == "1":
            building_mode()
        elif choice == "2":
            show_tutorial()
        elif choice == "3":
            configure_savedmachines_path()
        elif choice == "4":
            if Confirm.ask("[bold]Are you sure you want to exit?[/bold]"):
                console.clear()
                show_links()
                console.print("[bold cyan]Thanks for playing! Keep On Keeping On! 👋[/bold cyan]\n")
                break


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        console.print("\n\n[yellow]Game interrupted. Goodbye! 👋[/yellow]\n")
    except Exception as e:
        console.print(f"\n[red]Error: {e}[/red]\n")
        import traceback
        traceback.print_exc()

