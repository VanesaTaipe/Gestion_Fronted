import os

def print_directory_tree(start_path, indent=""):
    try:
        for item in os.listdir(start_path):
            if item in [".angular", ".vscode", "node_modules"]:
                continue  
            item_path = os.path.join(start_path, item)
            print(f"{indent}- {item}")
            if os.path.isdir(item_path):
                print_directory_tree(item_path, indent + "  ")
    except PermissionError:
        print(f"{indent}- [Permission Denied]")

if __name__ == "__main__":
    start_directory = "." 
    print(f"Directory tree for: {os.path.abspath(start_directory)}")
    print_directory_tree(start_directory)