import mysql.connector

try:
    conn = mysql.connector.connect(host='127.0.0.1', user='root', password='', database='despensa_inteligente')
    cur = conn.cursor()
    
    # Check if column exists
    cur.execute("SHOW COLUMNS FROM productos LIKE 'tienda_preferida'")
    if not cur.fetchone():
        print("Adding column tienda_preferida...")
        cur.execute("ALTER TABLE productos ADD COLUMN tienda_preferida ENUM('D1','OLIMPICA','ARA','MEGATIENDAS') DEFAULT NULL")
        print("Column added.")
    else:
        print("Column already exists.")
        
    conn.close()
except Exception as e:
    print(f"Error: {e}")
